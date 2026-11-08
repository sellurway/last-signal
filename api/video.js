export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };
export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed.' }); }

  const apiKey = process.env.Nvidiakey || process.env.navidiakey || process.env.FEDEMIC || process.env.fedemic;
  if (!apiKey) return res.status(503).json({ error: 'NVIDIA key not found. The running Vercel function must have the Nvidiakey environment variable.' });

  const endpoint = process.env.NVIDIA_VIDEO_API_URL;
  if (!endpoint) {
    return res.status(503).json({
      error: 'Video generation is not connected yet. NVIDIA WAN 2.2 requires a running NVIDIA NIM video server. Add its full OpenAI-compatible /v1/videos/generations URL as NVIDIA_VIDEO_API_URL in Vercel. Your existing Nvidiakey can remain unchanged.'
    });
  }

  let parsed;
  try { parsed = new URL(endpoint); } catch {
    return res.status(500).json({ error: 'NVIDIA_VIDEO_API_URL must be a valid HTTPS URL.' });
  }
  if (parsed.protocol !== 'https:') return res.status(500).json({ error: 'NVIDIA_VIDEO_API_URL must use HTTPS.' });

  const { prompt, inputReference } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim()) return res.status(400).json({ error: 'Enter a video prompt first.' });
  if (prompt.length > 8000) return res.status(413).json({ error: 'Your video prompt is too long.' });
  if (inputReference !== undefined && (typeof inputReference !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/i.test(inputReference) || inputReference.length > 11000000)) {
    return res.status(400).json({ error: 'Reference image must be JPG, PNG or WEBP and under 8 MB.' });
  }

  const payload = { model: 'wan-ai/wan2.2', prompt: prompt.trim(), size: '832x480', seconds: 4 };
  if (inputReference) payload.input_reference = inputReference;

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const raw = await upstream.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch {}
    if (!upstream.ok) {
      const detail = data?.detail || data?.error?.message || data?.message || raw.slice(0, 700);
      return res.status(upstream.status).json({ error: `NVIDIA video NIM HTTP ${upstream.status}: ${detail || 'No error details returned.'}` });
    }

    const encoded = data?.data?.[0]?.b64_json || data?.data?.b64_json || data?.b64_video || data?.artifacts?.[0]?.base64;
    if (typeof encoded !== 'string' || !encoded) {
      return res.status(502).json({ error: 'The video NIM returned no base64 MP4. Confirm NVIDIA WAN 2.2 and its OpenAI-compatible video endpoint are running.' });
    }

    const bytes = Buffer.from(encoded.replace(/^data:video\/[^;]+;base64,/, ''), 'base64');
    if (!bytes.length) return res.status(502).json({ error: 'The video NIM returned an empty video.' });
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'inline; filename="fedemic-video.mp4"');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(bytes);
  } catch {
    return res.status(502).json({ error: 'Could not reach the NVIDIA video NIM. Check NVIDIA_VIDEO_API_URL and confirm the GPU server is online.' });
  }
}
