export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const apiKey = process.env.FEDEMIC || process.env.fedemic || process.env.navidiakey || process.env.Nvidiakey;
  if (!apiKey) return res.status(500).json({ error: 'NVIDIA is not configured. Check the existing navidiakey environment variable in Vercel.' });
  const { text, language = 'en-US', voice = 'Magpie-Multilingual.EN-US.Aria' } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Enter a script first.' });
  if (text.length > 2000) return res.status(413).json({ error: 'Each speech generation is limited to 2,000 characters. Split longer scripts into sections.' });
  const allowedLanguages = ['en-US','es-US','fr-FR','de-DE','zh-CN','vi-VN','it-IT','hi-IN','ja-JP','ko-KR','ar-XA','pt-BR'];
  if (!allowedLanguages.includes(language)) return res.status(400).json({ error: 'That language is not supported by this NVIDIA voice endpoint yet.' });
  if (typeof voice !== 'string' || voice.length > 160 || !voice.startsWith('Magpie-Multilingual.')) return res.status(400).json({ error: 'Choose a supported NVIDIA Magpie voice.' });
  const controller = new AbortController();
  res.on('close', () => { if (!res.writableEnded) controller.abort(); });
  try {
    const form = new FormData();
    form.append('text', text.trim());
    form.append('language', language);
    form.append('voice', voice);
    form.append('sample_rate_hz', '22050');
    const upstream = await fetch('https://877104f7-e885-42b9-8de8-f6e4c6303969.invocation.api.nvcf.nvidia.com/v1/audio/synthesize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: controller.signal
    });
    if (!upstream.ok) {
      const detail = await upstream.text();
      return res.status(upstream.status).json({ error: `NVIDIA speech error (${upstream.status}): ${detail.slice(0, 900)}` });
    }
    const audio = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', 'attachment; filename="fedemic-voice.wav"');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(audio);
  } catch {
    if (controller.signal.aborted) return;
    return res.status(502).json({ error: 'Could not reach NVIDIA speech. Please try again.' });
  }
}
