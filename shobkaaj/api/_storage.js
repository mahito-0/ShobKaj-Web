const fs = require('fs');
const path = require('path');

const DB_PATH = path.resolve(process.cwd(), 'db.json');

const KV_URL = process.env.KV_REST_API_URL || process.env.VERCEL_KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.VERCEL_KV_REST_API_TOKEN;
const KV_KEY = process.env.KV_DB_KEY || 'shobkaaj:db';

const isProd = process.env.NODE_ENV === 'production';
const hasKV = Boolean(KV_URL && KV_TOKEN);

async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${KV_TOKEN}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.result ?? null;
}

async function kvSet(key, value) {
  const res = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ value })
  });
  if (!res.ok) throw new Error('KV set failed');
}

function fileLoad() {
  if (!fs.existsSync(DB_PATH)) {
    return { users: [], jobs: [], conversations: [], messages: [], pushSubs: [] };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function fileSave(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

async function loadDB() {
  if (isProd && hasKV) {
    const raw = await kvGet(KV_KEY);
    if (!raw) return { users: [], jobs: [], conversations: [], messages: [], pushSubs: [] };
    if (typeof raw === 'string') return JSON.parse(raw);
    return raw;
  }
  return fileLoad();
}

async function saveDB(db) {
  if (isProd && hasKV) {
    await kvSet(KV_KEY, JSON.stringify(db));
    return;
  }
  fileSave(db);
}

function userSafe(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

module.exports = { loadDB, saveDB, userSafe };


