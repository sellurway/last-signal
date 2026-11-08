export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed.' }); }

  const candidates = [
    ['Nvidiakey', process.env.Nvidiakey],
    ['navidiakey', process.env.navidiakey],
    ['FEDEMIC', process.env.FEDEMIC],
    ['fedemic', process.env.fedemic]
  ];
  const selected = candidates.find(([, value]) => typeof value === 'string' && value.trim());
  if (!selected) {
    return res.status(200).json({
      ok: false,
      configured: false,
      message: 'No NVIDIA key was found by the running Vercel function. Check that Nvidiakey is set for this project and the Production environment, then redeploy.'
    });
  }

  try {
    const upstream = await fetch('https://integrate.api.nvidia.com/v1/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${selected[1].trim()}`, Accept: 'application/json' }
    });
    if (upstream.ok) {
      return res.status(200).json({
        ok: true,
        configured: true,
        keyName: selected[0],
        message: `Vercel can read ${selected[0]} and NVIDIA accepted the key.`
      });
    }
    const raw = await upstream.text();
    let detail = '';
    try {
      const parsed = raw ? JSON.parse(raw) : {};
      detail = parsed?.detail || parsed?.error?.message || parsed?.message || '';
    } catch {}
    const message = upstream.status === 401
      ? 'Vercel found the key, but NVIDIA rejected it (401). Check that the value is a valid NVIDIA API key.'
      : upstream.status === 403
        ? 'Vercel found the key, but NVIDIA denied access (403). Check model/API permissions.'
        : upstream.status === 429
          ? 'Vercel found the key, but NVIDIA rate-limited the request (429). Check quota and try again.'
          : `Vercel found the key, but NVIDIA returned HTTP ${upstream.status}.`;
    return res.status(200).json({
      ok: false,
      configured: true,
      keyName: selected[0],
      upstreamStatus: upstream.status,
      message: detail ? `${message} ${String(detail).slice(0, 240)}` : message
    });
  } catch {
    return res.status(200).json({
      ok: false,
      configured: true,
      keyName: selected[0],
      message: 'Vercel found the key, but could not reach NVIDIA. Check the deployment/network and try again.'
    });
  }
}
