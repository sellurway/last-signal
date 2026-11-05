export const config = { api: { bodyParser: { sizeLimit: '8mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.FEDEMIC || process.env.fedemic || process.env.navidiakey;
  if (!apiKey) {
    return res.status(500).json({ error: 'NVIDIA is not configured. Check your existing navidiakey environment variable in Vercel.' });
  }

  const { prompt, image } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Enter an image prompt first.' });
  }
  if (prompt.length > 10000) {
    return res.status(413).json({ error: 'Your image prompt is too long. Please shorten it.' });
  }
  if (image !== undefined && (typeof image !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/i.test(image) || image.length > 7500000)) {
    return res.status(400).json({ error: 'The reference image is invalid or too large. Use a JPG, PNG or WEBP image under 5 MB.' });
  }

  try {
    const payload = { prompt: prompt.trim(), height: 1024, width: 1024, steps: 4, samples: 1, seed: 0 };
    if (image) payload.image = image;
    const upstream = await fetch('https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseBody = await upstream.text();
    let data = {};
    try { data = responseBody ? JSON.parse(responseBody) : {}; } catch { data = {}; }

    if (!upstream.ok) {
      const message = data?.detail || data?.error?.message || data?.message || (responseBody ? responseBody.slice(0, 900) : 'No error details returned by NVIDIA.');
      return res.status(upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502)
        .json({ error: `NVIDIA image API HTTP ${upstream.status}: ${message}` });
    }

    const output = data?.artifacts?.[0]?.base64 || data?.data?.[0]?.b64_json;
    if (typeof output !== 'string' || !output.trim()) {
      return res.status(502).json({ error: 'NVIDIA returned no image data. Check model access and try again.' });
    }

    return res.status(200).json({ image: output });
  } catch {
    return res.status(502).json({ error: 'Could not reach NVIDIA image generation. Please try again.' });
  }
}
