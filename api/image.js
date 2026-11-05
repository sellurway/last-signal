export const config = { api: { bodyParser: { sizeLimit: '8mb' } } };

const IMAGE_MODEL = 'gemini-3.1-flash-image';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI || process.env.gemini;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini is not configured. Add your Gemini API key to Vercel as GEMINI_API_KEY, then redeploy.' });
  }

  const { prompt, image } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Enter an image prompt first.' });
  }
  if (prompt.length > 10000) {
    return res.status(413).json({ error: 'Your image prompt is too long. Please shorten it.' });
  }

  const parts = [{ text: image
    ? 'Edit the supplied image according to these instructions. Preserve the original subject and composition unless the user asks to change them. Return the edited image. Instructions: ' + prompt.trim()
    : 'Generate a high-quality image from this description. Return the generated image. Description: ' + prompt.trim()
  }];

  if (image !== undefined) {
    const match = typeof image === 'string' && image.match(/^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/i);
    if (!match || image.length > 7500000) {
      return res.status(400).json({ error: 'The reference image is invalid or too large. Use a JPG, PNG or WEBP image under 5 MB.' });
    }
    parts.push({ inlineData: { mimeType: match[1].toLowerCase(), data: match[2] } });
  }

  try {
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
      })
    });

    const responseBody = await upstream.text();
    let data = {};
    try { data = responseBody ? JSON.parse(responseBody) : {}; } catch { data = {}; }

    if (!upstream.ok) {
      const message = data?.error?.message || data?.message || (responseBody ? responseBody.slice(0, 900) : 'No error details returned by Gemini.');
      return res.status(upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502)
        .json({ error: `Gemini image API HTTP ${upstream.status}: ${message}` });
    }

    const responseParts = data?.candidates?.flatMap(candidate => candidate?.content?.parts || []) || [];
    const output = responseParts.find(part => part?.inlineData?.data || part?.inline_data?.data);
    const base64 = output?.inlineData?.data || output?.inline_data?.data;
    if (typeof base64 !== 'string' || !base64.trim()) {
      const reason = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason;
      return res.status(502).json({ error: reason
        ? `Gemini did not return an image (${reason}). Try changing the prompt.`
        : 'Gemini returned no image data. Check that your API key has access to the Gemini image model and try again.' });
    }

    return res.status(200).json({ image: base64, mimeType: output.inlineData?.mimeType || output.inline_data?.mime_type || 'image/png' });
  } catch {
    return res.status(502).json({ error: 'Could not reach Gemini image generation. Please try again.' });
  }
}
