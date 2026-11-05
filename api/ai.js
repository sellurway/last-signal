export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.FEDEMIC || process.env.fedemic || process.env.navidiakey;
  if (!apiKey) {
    return res.status(500).json({ error: 'NVIDIA NIM is not configured. Add FEDEMIC in Vercel Environment Variables and redeploy.' });
  }

  const { prompt, system } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Enter a prompt first.' });
  }
  if (prompt.length > 20000 || (typeof system === 'string' && system.length > 5000)) {
    return res.status(413).json({ error: 'Your prompt is too long. Please shorten it and try again.' });
  }

  try {
    const upstream = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.3-70b-instruct',
        messages: [
          { role: 'system', content: typeof system === 'string' && system.trim() ? system : 'You are Fedemic AI, a helpful, clear and creative assistant.' },
          { role: 'user', content: prompt.trim() }
        ],
        temperature: 0.7,
        max_tokens: 2048,
        stream: false
      })
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const message = data?.error?.message || data?.message || 'NVIDIA NIM returned an error.';
      return res.status(upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502)
        .json({ error: message });
    }

    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(502).json({ error: 'NVIDIA returned an empty response. Try again.' });
    }

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(502).json({ error: 'Could not reach NVIDIA NIM. Please try again.' });
  }
}
