const { loadDB, userSafe } = require('./_storage');
const bcrypt = require('bcryptjs');

function verifyPassword(password, passwordHash) {
  return bcrypt.compareSync(password, passwordHash);
}

function userSafe(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = await loadDB();
  const user = db.users.find(u => (u.email || '').toLowerCase() === String(email).toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  if (!verifyPassword(String(password), user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // This app identifies user by x-user-id header from localStorage on the client.
  // So server just returns user and client will save userId in localStorage.
  return res.status(200).json({ user: userSafe(user) });
}


