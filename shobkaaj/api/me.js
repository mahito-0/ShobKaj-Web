
const { loadDB, userSafe } = require('./_storage');

module.exports = async function handler(req, res) {
  // IMPORTANT: This is a temporary and insecure way to identify the user.
  // We will replace this with a proper authentication system.
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = await loadDB();
  const user = db.users.find(u => u.id === userId);

  res.status(200).json({ user: user ? userSafe(user) : null });
}
