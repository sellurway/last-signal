export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };

const getConfig = () => {
  const raw = process.env.ACESTEP_API_URL;
  if (!raw) throw new Error('ACE-Step is not connected yet. Add ACESTEP_API_URL in Vercel after deploying the ACE-Step API server.');
  const base = raw.replace(/\\/+$/, '');
  const key = process.env.ACESTEP_API_KEY;
  return { base, key };
};

async function aceFetch(url, options = {}) {
  const { key } = getConfig();
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  if (key) headers.Authorization = `Bearer ${key}`;
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`ACE-Step API HTTP ${response.status}: ${body.slice(0, 700) || 'No error details returned.'}`);
  }
  return response;
}

function unwrap(json) {
  if (json?.error) throw new Error(typeof json.error === 'string' ? json.error : JSON.stringify(json.error));
  if (json?.code && Number(json.code) !== 200) throw new Error(json.message || 'ACE-Step rejected the request.');
  return json?.data ?? json;
}

export default async function handler(req, res) {
  try {
    const { base } = getConfig();

    if (req.method === 'GET' && req.query?.action === 'audio') {
      const audioPath = req.query.path;
      if (typeof audioPath !== 'string' || !audioPath.startsWith('/v1/audio?path=') || audioPath.length > 4096) {
        return res.status(400).json({ error: 'Invalid ACE-Step audio path.' });
      }
      const target = new URL(audioPath, base);
      if (target.origin !== new URL(base).origin || target.pathname !== '/v1/audio') {
        return res.status(400).json({ error: 'Invalid ACE-Step audio URL.' });
      }
      const upstream = await aceFetch(target.toString(), { headers: { Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.5' } });
      const audio = Buffer.from(await upstream.arrayBuffer());
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg');
      res.setHeader('Content-Length', String(audio.length));
      res.setHeader('Content-Disposition', 'attachment; filename="fedemic-ace-step-track.mp3"');
      res.setHeader('Cache-Control', 'private, no-store');
      return res.status(200).send(audio);
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST, GET');
      return res.status(405).json({ error: 'Method not allowed.' });
    }

    const { action, prompt, lyrics, duration, instrumental, language, taskId } = req.body || {};

    if (action === 'status') {
      if (typeof taskId !== 'string' || !/^[a-zA-Z0-9-]{8,100}$/.test(taskId)) {
        return res.status(400).json({ error: 'Invalid ACE-Step task ID.' });
      }
      const response = await aceFetch(`${base}/query_result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id_list: [taskId] })
      });
      const data = unwrap(await response.json());
      const task = Array.isArray(data) ? data[0] : data?.[0] || data;
      if (!task) return res.status(502).json({ error: 'ACE-Step returned no task status.' });
      let result = task.result;
      if (typeof result === 'string') {
        try { result = JSON.parse(result); } catch { result = []; }
      }
      const first = Array.isArray(result) ? result[0] : result;
      const status = Number(task.status ?? first?.status ?? 0);
      return res.status(200).json({
        status,
        error: task.error || first?.error || null,
        audioPath: first?.file || first?.audio_path || null,
        prompt: first?.prompt || '',
        lyrics: first?.lyrics || '',
        metas: first?.metas || null
      });
    }

    if (action !== 'create') return res.status(400).json({ error: 'Choose a valid music action.' });
    if (typeof prompt !== 'string' || !prompt.trim()) return res.status(400).json({ error: 'Describe the music you want to create.' });
    if (prompt.length > 4000 || (typeof lyrics === 'string' && lyrics.length > 12000)) return res.status(413).json({ error: 'Your music prompt or lyrics are too long.' });

    const seconds = Math.max(30, Math.min(300, Number(duration) || 120));
    const payload = {
      prompt: prompt.trim(),
      lyrics: instrumental === true ? '' : (typeof lyrics === 'string' ? lyrics.trim() : ''),
      thinking: true,
      use_format: true,
      vocal_language: typeof language === 'string' ? language : 'en',
      audio_format: 'mp3',
      audio_duration: seconds,
      inference_steps: 8,
      batch_size: 1
    };
    const response = await aceFetch(`${base}/release_task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = unwrap(await response.json());
    if (!data?.task_id) throw new Error('ACE-Step did not return a task ID.');
    return res.status(202).json({ taskId: data.task_id, status: data.status || 'queued', queuePosition: data.queue_position ?? null });
  } catch (error) {
    const message = error?.message || 'ACE-Step music generation failed.';
    const status = message.includes('not connected') ? 503 : 502;
    return res.status(status).json({ error: message });
  }
}
