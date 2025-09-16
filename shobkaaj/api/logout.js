module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  // Client stores userId in localStorage; there is no server session.
  // Just return success so client can clear its storage.
  return res.status(200).json({ ok: true });
}


