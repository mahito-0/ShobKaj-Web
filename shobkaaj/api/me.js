
import fs from 'fs';
import path from 'path';

// Temporary db access
const DB_PATH = path.resolve(process.cwd(), 'db.json');

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    return { users: [] };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function userSafe(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

export default function handler(req, res) {
  // IMPORTANT: This is a temporary and insecure way to identify the user.
  // We will replace this with a proper authentication system.
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = loadDB();
  const user = db.users.find(u => u.id === userId);

  res.status(200).json({ user: user ? userSafe(user) : null });
}
