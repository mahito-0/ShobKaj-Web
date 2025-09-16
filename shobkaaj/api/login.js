import { loadDB, userSafe } from './_storage';
import crypto from 'crypto';

function verifyPassword(password, passwordHash) {
  if (!passwordHash || typeof passwordHash !== 'string') return false;
  // Support pbkdf2$<salt>$<hash> produced in register.js
  if (passwordHash.startsWith('pbkdf2$')) {
    const [, salt, stored] = passwordHash.split('$');
    const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(stored, 'hex'), Buffer.from(computed, 'hex'));
  }
  // Fallback: attempt bcrypt-style hashes if present (not available without dependency)
  return false;
}

function userSafe(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

export default async function handler(req, res) {
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


