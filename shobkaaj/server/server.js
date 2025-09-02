import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import nodemailer from 'nodemailer';
import webpush from 'web-push';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

dotenv.config({ path: path.join(ROOT, '.env') });

// Data dir
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'db.json');
const VAPID_FILE = path.join(DATA_DIR, 'vapid.json');

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: true, credentials: true } });

// DB
function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      users: [], jobs: [], conversations: [], messages: [], pushSubs: [], notifications: []
    }, null, 2));
  }
  const obj = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  obj.users ||= []; obj.jobs ||= []; obj.conversations ||= []; obj.messages ||= [];
  obj.pushSubs ||= []; obj.notifications ||= []; // NOTIFICATIONS
  return obj;
}
let db = loadDB();
function saveDB() { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

// Uploads
const UPLOAD_DIR = path.join(ROOT, 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const extFromMime = (m) => ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[m] || '.jpg');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, req.user.id + '_' + Date.now() + extFromMime(file.mimetype))
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => IMAGE_TYPES.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only JPG/PNG/WEBP images allowed'))
});

// Email (console preview if no SMTP)
const hasSMTP = !!process.env.SMTP_HOST;
const transporter = hasSMTP
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    })
  : nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true });

async function sendEmail(to, subject, html) {
  if (!to) return;
  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'no-reply@shobkaaj.local',
      to, subject, html
    });
    if (!hasSMTP && info?.message) {
      console.log('--- Email Preview ---\nTo:', to, '\nSubject:', subject, '\n', info.message.toString(), '\n---------------------');
    }
  } catch (e) { console.error('Email error:', e.message); }
}

// Web Push
let vapidKeys = null;
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  vapidKeys = { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
} else if (fs.existsSync(VAPID_FILE)) {
  vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
} else {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
  console.log('Generated VAPID keys at', VAPID_FILE);
}
webpush.setVapidDetails('mailto:admin@shobkaaj.com', vapidKeys.publicKey, vapidKeys.privateKey);

// Helpers
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
const sessionMiddleware = session({
  secret: 'shobkaaj_secret_dev_only',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
});
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

// Static
app.use(express.static(path.join(ROOT, 'public')));

// Seed admin
const ADMIN_EMAIL = 'admin@shobkaaj.com';
const ADMIN_PASS = 'Admin@123';
function ensureAdmin() {
  if (!db.users.find(u => u.email === ADMIN_EMAIL)) {
    db.users.push({
      id: 'u_admin',
      name: 'Admin',
      email: ADMIN_EMAIL,
      passwordHash: bcrypt.hashSync(ADMIN_PASS, 10),
      role: 'admin',
      phone: '',
      nid: '',
      verified: true,
      banned: false,
      skills: [],
      bio: '',
      avatar: '',
      rating: 0,
      ratingCount: 0,
      location: { lat: 23.8103, lng: 90.4125, address: 'Dhaka, Bangladesh' },
      createdAt: Date.now()
    });
    saveDB();
    console.log('Seeded admin user:', ADMIN_EMAIL, ADMIN_PASS);
  }
}
ensureAdmin();

function authRequired(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  const user = db.users.find(u => u.id === req.session.userId);
  if (!user || user.banned) return res.status(401).json({ error: 'Unauthorized' });
  req.user = user; next();
}
function roleRequired(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
function userSafe(user) { if (!user) return null; const { passwordHash, ...safe } = user; return safe; }
function distanceKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some(v => typeof v !== 'number')) return null;
  const toRad = d => d * Math.PI / 180, R = 6371;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Presence
const onlineUsers = new Map();
function emitToUser(userId, event, payload) {
  const set = onlineUsers.get(userId);
  if (!set) return;
  set.forEach(sid => io.to(sid).emit(event, payload));
}
async function sendPushTo(userId, payload) {
  const subs = db.pushSubs.filter(s => s.userId === userId);
  for (const s of subs) {
    try { await webpush.sendNotification(s.subscription, JSON.stringify(payload)); }
    catch (e) {
      if (e.statusCode === 410 || e.statusCode === 404) {
        db.pushSubs = db.pushSubs.filter(x => x !== s); saveDB();
      } else console.error('Push error:', e.statusCode, e.body || e.message);
    }
  }
}

// NOTIFICATIONS: store + emit + push
async function notifyUser(userId, payload) {
  // payload: { type, title, body, url }
  const n = {
    id: uuidv4(),
    userId,
    type: payload?.type || 'info',
    title: payload?.title || '',
    body: payload?.body || '',
    url: payload?.url || '',
    read: false,
    createdAt: Date.now()
  };
  db.notifications.push(n); // persist
  saveDB();

  // realtime
  emitToUser(userId, 'notify', n);
  // web push
  await sendPushTo(userId, { title: n.title || 'ShobKaaj', body: n.body || '', url: n.url || '/', type: n.type });
}

// Auth
app.post('/api/register', (req, res) => {
  const { name, email, password, role, phone, nid, skills = [], bio = '', location } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  if (!['client', 'worker'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  if (db.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });
  const id = uuidv4();
  const newUser = {
    id, name, email, role, phone: phone || '', nid: nid || '',
    passwordHash: bcrypt.hashSync(password, 10),
    verified: false, banned: false, skills, bio, avatar: '',
    rating: 0, ratingCount: 0,
    location: location && typeof location.lat === 'number' && typeof location.lng === 'number'
      ? location : { lat: 23.8103, lng: 90.4125, address: 'Dhaka, Bangladesh' },
    createdAt: Date.now()
  };
  db.users.push(newUser); saveDB(); req.session.userId = id;
  res.json({ user: userSafe(newUser) });
});
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email);
  if (!user || user.banned) return res.status(401).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, user.passwordHash)) return res.status(401).json({ error: 'Invalid credentials' });
  req.session.userId = user.id; res.json({ user: userSafe(user) });
});
app.post('/api/logout', authRequired, (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = db.users.find(u => u.id === req.session.userId);
  res.json({ user: user ? userSafe(user) : null });
});
app.put('/api/me', authRequired, (req, res) => {
  const { name, phone, nid, skills, bio, location } = req.body;
  if (name) req.user.name = String(name).slice(0, 100);
  if (phone != null) req.user.phone = String(phone).slice(0, 40);
  if (nid != null) req.user.nid = String(nid).slice(0, 40);
  if (bio != null) req.user.bio = String(bio).slice(0, 500);
  if (skills != null) {
    req.user.skills = Array.isArray(skills) ? skills.map(s => String(s).trim()).filter(Boolean)
      : String(skills).split(',').map(s => s.trim()).filter(Boolean);
  }
  if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
    req.user.location = { lat: location.lat, lng: location.lng, address: String(location.address || 'Updated location') };
  }
  saveDB(); res.json({ user: userSafe(req.user) });
});
app.post('/api/me/avatar', authRequired, upload.single('avatar'), (req, res) => {
  const relPath = '/uploads/' + path.basename(req.file.path);
  req.user.avatar = relPath; saveDB(); res.json({ ok: true, avatar: relPath });
});

// Notifications API (Public key)
app.get('/api/notifications/public-key', authRequired, (req, res) => res.json({ key: vapidKeys.publicKey }));

// Jobs
app.get('/api/jobs', authRequired, (req, res) => {
  const { q, lat, lng, radiusKm } = req.query;
  let jobs = db.jobs.map(j => ({ ...j }));
  if (q) {
    const term = String(q).toLowerCase();
    jobs = jobs.filter(j => j.title.toLowerCase().includes(term) || j.description.toLowerCase().includes(term));
  }
  if (lat && lng) {
    const flat = parseFloat(lat), flng = parseFloat(lng);
    jobs = jobs.map(j => {
      const d = (j.location?.lat != null && j.location?.lng != null) ? distanceKm(flat, flng, j.location.lat, j.location.lng) : null;
      return { ...j, distanceKm: d };
    });
    const r = parseFloat(radiusKm);
    if (!Number.isNaN(r) && r > 0) jobs = jobs.filter(j => j.distanceKm != null && j.distanceKm <= r);
    jobs.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
  } else {
    jobs.sort((a, b) => b.createdAt - a.createdAt);
  }
  res.json({ jobs });
});
app.get('/api/jobs/mine', authRequired, (req, res) => {
  if (req.user.role === 'client') {
    const myJobs = db.jobs.filter(j => j.createdBy === req.user.id)
      .map(j => ({ ...j, applicationsCount: (j.applications || []).length }));
    return res.json({ myJobs });
  } else {
    const assignedJobs = db.jobs.filter(j => j.assignedTo === req.user.id);
    const appliedJobs = db.jobs.filter(j => (j.applications || []).some(a => a.workerId === req.user.id))
      .map(j => ({ ...j, myApplication: j.applications.find(x => x.workerId === req.user.id) }));
    return res.json({ assignedJobs, appliedJobs });
  }
});
app.get('/api/jobs/:id', authRequired, (req, res) => {
  const job = db.jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found' });
  res.json({ job, client: userSafe(db.users.find(u => u.id === job.createdBy)), worker: userSafe(db.users.find(u => u.id === job.assignedTo)) });
});
app.post('/api/jobs', authRequired, roleRequired('client'), (req, res) => {
  const { title, description, budget, deadline, location } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Missing title/description' });
  const job = {
    id: uuidv4(),
    title: String(title).slice(0, 140),
    description: String(description).slice(0, 2000),
    budget: Number(budget) || 0,
    deadline: deadline || '',
    location: location || req.user.location,
    createdBy: req.user.id,
    assignedTo: null,
    status: 'open',
    applications: [],
    reviews: [],
    createdAt: Date.now()
  };
  db.jobs.push(job); saveDB(); res.json({ job });
});
app.post('/api/jobs/:id/apply', authRequired, roleRequired('worker'), async (req, res) => {
  const job = db.jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.createdBy === req.user.id) return res.status(400).json({ error: 'Cannot apply to your own job' });
  job.applications = job.applications || [];
  if (job.applications.find(a => a.workerId === req.user.id)) return res.status(400).json({ error: 'Already applied' });
  const note = String((req.body?.note || '')).slice(0, 500);
  const appRec = { workerId: req.user.id, note, status: 'pending', createdAt: Date.now() };
  job.applications.push(appRec); saveDB();

  const client = db.users.find(u => u.id === job.createdBy);
  // Persisted notification + realtime + push
  await notifyUser(job.createdBy, {
    type: 'application',
    title: 'New application',
    body: `${req.user.name} applied to "${job.title}"`,
    url: '/my-jobs.html'
  });
  await sendEmail(client?.email, `New application for "${job.title}"`, `<p>${req.user.name} applied to your job "${job.title}".</p><p>Note: ${note || '(none)'}.</p><p><a href="http://localhost:3000/my-jobs.html">Review applications</a></p>`);

  res.json({ ok: true, application: appRec });
});
app.get('/api/jobs/:id/applications', authRequired, roleRequired('client'), (req, res) => {
  const job = db.jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.createdBy !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const applications = (job.applications || []).map(a => ({ ...a, worker: userSafe(db.users.find(u => u.id === a.workerId)) }));
  res.json({ applications });
});
app.put('/api/jobs/:id/assign', authRequired, roleRequired('client'), async (req, res) => {
  const job = db.jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found' });
  if (job.createdBy !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { workerId } = req.body || {};
  const worker = db.users.find(u => u.id === workerId && u.role === 'worker');
  if (!worker) return res.status(400).json({ error: 'Invalid worker' });
  job.assignedTo = workerId; job.status = 'assigned';
  job.applications = (job.applications || []).map(a => ({ ...a, status: a.workerId === workerId ? 'accepted' : 'rejected' }));
  saveDB();

  await notifyUser(workerId, { type: 'assigned', title: 'Job assigned', body: `"${job.title}" assigned to you`, url: '/my-jobs.html' });
  await notifyUser(job.createdBy, { type: 'assigned', title: 'Worker assigned', body: `Assigned ${worker.name} to "${job.title}"`, url: '/my-jobs.html' });

  const client = db.users.find(u => u.id === job.createdBy);
  await sendEmail(worker.email, `You were assigned: "${job.title}"`, `<p>You have been assigned to "${job.title}".</p><p><a href="http://localhost:3000/my-jobs.html">View job</a></p>`);
  await sendEmail(client?.email, `Worker assigned: "${job.title}"`, `<p>You assigned ${worker.name} to "${job.title}".</p><p><a href="http://localhost:3000/my-jobs.html">View job</a></p>`);

  res.json({ job });
});
app.post('/api/jobs/:id/complete', authRequired, roleRequired('client'), async (req, res) => {
  const job = db.jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found' });
  if (job.createdBy !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (!job.assignedTo) return res.status(400).json({ error: 'No worker assigned' });
  const rating = Math.max(1, Math.min(5, Number(req.body?.rating || 0)));
  const comment = String((req.body?.comment || '')).slice(0, 500);
  job.status = 'completed';
  job.reviews = job.reviews || [];
  job.reviews.push({ by: req.user.id, target: job.assignedTo, rating, comment, createdAt: Date.now() });
  const worker = db.users.find(u => u.id === job.assignedTo);
  if (worker) {
    worker.ratingCount = (worker.ratingCount || 0) + 1;
    worker.rating = ((worker.rating || 0) * (worker.ratingCount - 1) + rating) / worker.ratingCount;
  }
  saveDB();

  await notifyUser(job.assignedTo, { type: 'completed', title: 'Job completed', body: `"${job.title}" completed. You received ${rating}★`, url: '/my-jobs.html' });
  await sendEmail(worker?.email, `Job completed: "${job.title}"`, `<p>Your job "${job.title}" was marked completed.</p><p>Rating: ${rating}★</p>`);

  res.json({ job });
});

// Job-to-chat (unchanged)
app.post('/api/jobs/:id/chat', authRequired, (req, res) => {
  const job = db.jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  let otherId = null;
  if (req.user.role === 'worker') otherId = job.createdBy;
  else if (req.user.role === 'client') otherId = req.body?.workerId || job.assignedTo;
  else return res.status(403).json({ error: 'Forbidden' });
  if (!otherId) return res.status(400).json({ error: 'No counterpart' });
  if (otherId === req.user.id) return res.status(400).json({ error: 'Cannot chat with yourself' });
  const other = db.users.find(u => u.id === otherId);
  if (!other) return res.status(404).json({ error: 'User not found' });
  let conv = db.conversations.find(c => c.jobId === job.id && c.participants.includes(req.user.id) && c.participants.includes(otherId));
  if (!conv) {
    conv = { id: uuidv4(), participants: [req.user.id, otherId], jobId: job.id, createdAt: Date.now() };
    db.conversations.push(conv); saveDB();
  }
  res.json({ conversation: conv });
});

// Conversations
function getOrCreateConversation(userA, userB, jobId = null) {
  let conv = db.conversations.find(c => c.participants.includes(userA) && c.participants.includes(userB) && c.jobId === jobId);
  if (!conv) {
    conv = { id: uuidv4(), participants: [userA, userB], jobId: jobId || null, createdAt: Date.now() };
    db.conversations.push(conv); saveDB();
  }
  return conv;
}
app.get('/api/conversations', authRequired, (req, res) => {
  const myId = req.user.id;
  const list = db.conversations
    .filter(c => c.participants.includes(myId))
    .map(c => ({
      ...c,
      other: userSafe(db.users.find(u => u.id !== myId && c.participants.includes(u.id))),
      lastMessage: [...db.messages].reverse().find(m => m.conversationId === c.id) || null
    }))
    .sort((a, b) => (b.lastMessage?.createdAt || b.createdAt) - (a.lastMessage?.createdAt || a.createdAt));
  res.json({ conversations: list });
});
app.post('/api/conversations', authRequired, (req, res) => {
  const { otherUserId, jobId } = req.body;
  if (!otherUserId) return res.status(400).json({ error: 'Missing otherUserId' });
  const other = db.users.find(u => u.id === otherUserId);
  if (!other) return res.status(404).json({ error: 'User not found' });
  const conv = getOrCreateConversation(req.user.id, otherUserId, jobId || null);
  res.json({ conversation: conv });
});
app.get('/api/conversations/:id/messages', authRequired, (req, res) => {
  const conv = db.conversations.find(c => c.id === req.params.id);
  if (!conv) return res.status(404).json({ error: 'Not found' });
  if (!conv.participants.includes(req.user.id) && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const messages = db.messages.filter(m => m.conversationId === conv.id).sort((a, b) => a.createdAt - b.createdAt);
  res.json({ messages });
});

// Worker discovery
app.get('/api/workers', authRequired, (req, res) => {
  const { skill, q, lat, lng, radiusKm, minRating } = req.query;
  let list = db.users.filter(u => u.role === 'worker' && !u.banned);
  const term = (skill || q) ? String(skill || q).toLowerCase() : null;
  if (term) {
    list = list.filter(u =>
      (u.skills || []).some(s => s.toLowerCase().includes(term)) ||
      (u.bio || '').toLowerCase().includes(term) ||
      (u.name || '').toLowerCase().includes(term)
    );
  }
  const flat = parseFloat(lat), flng = parseFloat(lng);
  let results = list.map(u => {
    const d = (typeof flat === 'number' && !Number.isNaN(flat) && typeof flng === 'number' && !Number.isNaN(flng) && u.location?.lat != null)
      ? distanceKm(flat, flng, u.location.lat, u.location.lng)
      : null;
    return { ...userSafe(u), distanceKm: d };
  });
  const r = parseFloat(radiusKm);
  if (!Number.isNaN(r) && r > 0) results = results.filter(w => w.distanceKm != null && w.distanceKm <= r);
  const mr = parseFloat(minRating);
  if (!Number.isNaN(mr)) results = results.filter(w => (w.rating || 0) >= mr);
  if (!Number.isNaN(flat) && !Number.isNaN(flng)) results.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
  else results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  res.json({ workers: results });
});

// NOTIFICATIONS API
app.get('/api/notifications', authRequired, (req, res) => {
  const unreadOnly = String(req.query.unread || '') === '1';
  let list = db.notifications.filter(n => n.userId === req.user.id);
  if (unreadOnly) list = list.filter(n => !n.read);
  list.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ notifications: list });
});
app.post('/api/notifications/read', authRequired, (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  let count = 0;
  db.notifications.forEach(n => {
    if (n.userId === req.user.id && ids.includes(n.id) && !n.read) { n.read = true; count++; }
  });
  saveDB(); res.json({ updated: count });
});
app.post('/api/notifications/read-all', authRequired, (req, res) => {
  let count = 0;
  db.notifications.forEach(n => {
    if (n.userId === req.user.id && !n.read) { n.read = true; count++; }
  });
  saveDB(); res.json({ updated: count });
});

// Admin
app.get('/api/users', authRequired, roleRequired('admin'), (req, res) => res.json({ users: db.users.map(userSafe) }));
app.patch('/api/users/:id', authRequired, roleRequired('admin'), (req, res) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const { banned, verified } = req.body;
  if (typeof banned === 'boolean') user.banned = banned;
  if (typeof verified === 'boolean') user.verified = verified;
  saveDB(); res.json({ user: userSafe(user) });
});
app.get('/api/admin/conversations', authRequired, roleRequired('admin'), (req, res) => {
  const list = db.conversations.map(c => ({
    ...c,
    participantsInfo: c.participants.map(pid => userSafe(db.users.find(u => u.id === pid))),
    lastMessage: [...db.messages].reverse().find(m => m.conversationId === c.id) || null
  }));
  res.json({ conversations: list });
});
app.get('/api/admin/jobs', authRequired, roleRequired('admin'), (req, res) => {
  const jobs = db.jobs.map(j => ({
    ...j,
    client: userSafe(db.users.find(u => u.id === j.createdBy)),
    worker: userSafe(db.users.find(u => u.id === j.assignedTo))
  }));
  res.json({ jobs });
});

// Sockets
io.on('connection', (socket) => {
  const sess = socket.request.session;
  const userId = sess?.userId;
  const user = db.users.find(u => u.id === userId);
  if (!user || user.banned) { socket.disconnect(true); return; }

  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socket.id);
  io.to('admins').emit('presence', { userId, online: true, count: onlineUsers.get(userId).size });

  socket.on('join-room', (conversationId) => {
    const conv = db.conversations.find(c => c.id === conversationId);
    if (!conv) return;
    if (user.role !== 'admin' && !conv.participants.includes(userId)) return;
    socket.join(conversationId);
  });

  socket.on('send-message', ({ conversationId, text }) => {
    text = (text || '').toString().slice(0, 2000);
    if (!text.trim()) return;
    const conv = db.conversations.find(c => c.id === conversationId);
    if (!conv) return;
    if (user.role !== 'admin' && !conv.participants.includes(userId)) return;
    const message = { id: uuidv4(), conversationId, from: userId, text, createdAt: Date.now() };
    db.messages.push(message); saveDB();
    io.to(conversationId).emit('new-message', { message, fromUser: userSafe(user) });
    io.to('admins').emit('monitor-message', { message, conversationId, participants: conv.participants });
  });

  socket.on('typing', ({ conversationId, isTyping }) => {
    socket.to(conversationId).emit('typing', { userId, isTyping: !!isTyping });
  });

  socket.on('admin-watch', () => {
    if (user.role === 'admin') {
      socket.join('admins');
      const snapshot = [...onlineUsers.entries()].map(([uid, set]) => ({ userId: uid, count: set.size }));
      socket.emit('presence-snapshot', snapshot);
    }
  });

  socket.on('disconnect', () => {
    if (onlineUsers.has(userId)) {
      const set = onlineUsers.get(userId);
      set.delete(socket.id);
      const count = set.size;
      if (count === 0) onlineUsers.delete(userId);
      io.to('admins').emit('presence', { userId, online: count > 0, count });
    }
  });
});

// Fallback
app.get('*', (req, res) => res.sendFile(path.join(ROOT, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`ShobKaaj running on http://localhost:${PORT}`));