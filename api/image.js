export const config = { api: { bodyParser: { sizeLimit: '8mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed.' }); }
  const apiKey = process.env.FEDEMIC || process.env.fedemic || process.env.navidiakey || process.env.Nvidiakey;
  if (!apiKey) return res.status(500).json({ error: 'NVIDIA is not configured. Add your existing NVIDIA key to Vercel as FEDEMIC or navidiakey, then redeploy.' });
  const { prompt, image } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim()) return res.status(400).json({ error: 'Enter an image prompt first.' });
  if (prompt.length > 10000) return res.status(413).json({ error: 'Your image prompt is too long.' });
  let endpoint = 'https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell';
  const payload = { prompt: prompt.trim(), steps: 4, seed: 0 };
  if (image !== undefined) {
    const match = typeof image === 'string' && image.match(/^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/i);
    if (!match || image.length > 7500000) return res.status(400).json({ error: 'The reference image is invalid or too large. Use JPG, PNG or WEBP under 5 MB.' });
    endpoint = process.env.NVIDIA_IMAGE_EDIT_URL || 'https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-kontext-dev';
    payload.image = image;
  }
  const controller = new AbortController();
  res.on('close', () => { if (!res.writableEnded) controller.abort(); });
  try {
    const upstream = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
    const raw = await upstream.text();
    let data = {}; try { data = raw ? JSON.parse(raw) : {}; } catch {}
    if (!upstream.ok) {
      const detail = data?.detail || data?.message || data?.error?.message || raw.slice(0, 900) || 'No details returned.';
      return res.status(upstream.status).json({ error: `NVIDIA image API HTTP ${upstream.status}: ${detail}` });
    }
    const base64 = data?.artifacts?.[0]?.base64 || data?.data?.[0]?.b64_json || data?.image || data?.output?.[0]?.image;
    if (typeof base64 !== 'string' || !base64) return res.status(502).json({ error: 'NVIDIA returned no image data. Check that your key has access to the selected visual model.' });
    const mimeType = data?.artifacts?.[0]?.mime_type || 'image/png';
    return res.status(200).json({ image: base64.replace(/^data:image\/[^;]+;base64,/, ''), mimeType });
  } catch { if (controller.signal.aborted) return; return res.status(502).json({ error: 'Could not reach NVIDIA image generation. Please try again.' }); }
}
