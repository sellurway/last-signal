export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed.' }); }
  const apiKey = process.env.Nvidiakey || process.env.navidiakey || process.env.FEDEMIC || process.env.fedemic;
  if (!apiKey) return res.status(500).json({ error: 'NVIDIA NIM is not configured. Check the existing Vercel server environment variable.' });
  const { prompt, system, images } = req.body || {};
  if (typeof prompt !== 'string' || (!prompt.trim() && !Array.isArray(images))) return res.status(400).json({ error: 'Enter a message or attach an image.' });
  if (prompt.length > 20000 || (typeof system === 'string' && system.length > 5000)) return res.status(413).json({ error: 'Your prompt is too long. Please shorten it and try again.' });
  const attached = Array.isArray(images) ? images : [];
  if (attached.length > 3) return res.status(400).json({ error: 'You can attach up to 3 images per message.' });
  const validImages = [];
  for (const image of attached) {
    if (typeof image !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/i.test(image) || image.length > 1500000) return res.status(400).json({ error: 'An image is invalid or too large. Use JPG, PNG or WEBP images under 1.1 MB after compression.' });
    validImages.push(image);
  }
  const controller = new AbortController();
  res.on('close', () => { if (!res.writableEnded) controller.abort(); });
  try {
    const userContent = validImages.length ? [...validImages.map(url => ({ type: 'image_url', image_url: { url } })), { type: 'text', text: prompt.trim() || 'Please describe and help me understand the attached image(s).' }] : prompt.trim();
    const upstream = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        model: validImages.length ? 'nvidia/nemotron-nano-12b-v2-vl' : (process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b'),
        messages: [
          { role: 'system', content: typeof system === 'string' && system.trim() ? system : 'You are Fedemic AI, a helpful, clear and creative assistant.' },
          { role: 'user', content: userContent }
        ],
        temperature: 0.7, max_tokens: 4096, stream: false,
        chat_template_kwargs: { enable_thinking: false }
      }),
      signal: controller.signal
    });
    const responseBody = await upstream.text();
    let data = {};
    try { data = responseBody ? JSON.parse(responseBody) : {}; } catch { data = {}; }
    if (!upstream.ok) {
      const message = data?.error?.message || data?.error?.detail || data?.message || data?.detail || data?.title || (responseBody ? responseBody.slice(0, 1000) : 'No error details returned by NVIDIA.');
      return res.status(upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502).json({ error: `NVIDIA NIM HTTP ${upstream.status}: ${message}` });
    }
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) return res.status(502).json({ error: 'NVIDIA returned an empty response. Try again.' });
    return res.status(200).json({ text });
  } catch { if (controller.signal.aborted) return; return res.status(502).json({ error: 'Could not reach NVIDIA NIM. Please try again.' }); }
}
