const fs = require('fs');
const path = require('path');

const DB_PATH = path.resolve(process.cwd(), '..\api\db.json');
const KV_URL = process.env.KV_REST_API_URL || process.env.VERCEL_KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.VERCEL_KV_REST_API_TOKEN;
const KV_KEY = process.env.KV_DB_KEY || 'shobkaaj:db';

async function migrate() {
  if (!KV_URL || !KV_TOKEN) {
    console.log('Vercel KV credentials not found, skipping migration.');
    return;
  }

  if (!fs.existsSync(DB_PATH)) {
    console.log('db.json not found, skipping migration.');
    return;
  }

  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

  console.log('Migrating data to Vercel KV...');

  const res = await fetch(`${KV_URL}/set/${encodeURIComponent(KV_KEY)}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ value: JSON.stringify(db) })
  });

  if (res.ok) {
    console.log('Data migration successful.');
  } else {
    console.error('Data migration failed.');
  }
}

migrate();
