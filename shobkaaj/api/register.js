import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.resolve(process.cwd(), 'db.json');

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    return { users: [], jobs: [], conversations: [], messages: [], pushSubs: [] };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function hashPassword(password) {
  // Lightweight PBKDF2 (since bcrypt isn't available in edge env)
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$${salt}$${hash}`;
}

function userSafe(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = req.body || {};
  const { name, email, password, role, phone, nid, skills, location } = body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = loadDB();
  const existing = db.users.find(u => (u.email || '').toLowerCase() === String(email).toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const id = crypto.randomUUID();
  const passwordHash = hashPassword(password);
  const user = {
    id,
    name,
    email,
    role,
    phone: phone || '',
    nid: nid || '',
    passwordHash,
    verified: false,
    banned: false,
    skills: Array.isArray(skills) ? skills : [],
    bio: '',
    avatar: '',
    rating: 0,
    ratingCount: 0,
    location: location || null,
    createdAt: Date.now()
  };

  db.users.push(user);
  saveDB(db);

  res.status(200).json({ user: userSafe(user) });
}


