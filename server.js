const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
require('dotenv').config();

const app        = express();
const PORT       = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme-in-production';
const DB_PATH    = process.env.DB_PATH || path.join(__dirname, 'submissions.json');

// ─── JSON file database ───────────────────────────────────────────────────────
function readDB() {
  if (!fs.existsSync(DB_PATH)) return { nextId: 1, submissions: [] };
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return { nextId: 1, submissions: [] }; }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function insertSubmission(fields) {
  const db   = readDB();
  const entry = { id: db.nextId++, ...fields, status: 'new', createdAt: new Date().toISOString() };
  db.submissions.push(entry);
  writeDB(db);
  return entry;
}

function getAllSubmissions() { return readDB().submissions.reverse(); }

function updateStatus(id, status) {
  const db = readDB();
  const row = db.submissions.find(r => r.id === Number(id));
  if (row) row.status = status;
  writeDB(db);
}

function deleteSubmission(id) {
  const db = readDB();
  db.submissions = db.submissions.filter(r => r.id !== Number(id));
  writeDB(db);
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const submitTimestamps = new Map();
function rateLimit(req, res, next) {
  const ip  = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  if (now - (submitTimestamps.get(ip) || 0) < 60_000) {
    return res.status(429).json({ error: 'Подождите минуту перед повторной отправкой' });
  }
  submitTimestamps.set(ip, now);
  next();
}

// ─── Admin auth ───────────────────────────────────────────────────────────────
function adminAuth(req, res, next) {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Неверный токен' });
  }
  next();
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.post('/api/submit', rateLimit, (req, res) => {
  const { firstName, lastName, email, phone, notes, meetingDate } = req.body;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim()) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Некорректный email' });
  }

  try {
    const entry = insertSubmission({
      firstName:   firstName.trim(),
      lastName:    lastName.trim(),
      email:       email.trim().toLowerCase(),
      phone:       phone.trim(),
      notes:       notes?.trim() || null,
      meetingDate: meetingDate || null,
    });
    res.json({ success: true, id: entry.id });
  } catch (err) {
    console.error('Write error:', err);
    res.status(500).json({ error: 'Ошибка сервера. Попробуйте позже.' });
  }
});

app.get('/api/admin/submissions', adminAuth, (_req, res) => {
  res.json(getAllSubmissions());
});

app.patch('/api/admin/submissions/:id', adminAuth, (req, res) => {
  const allowed = ['new', 'in-progress', 'done', 'rejected'];
  if (!allowed.includes(req.body.status)) {
    return res.status(400).json({ error: 'Недопустимый статус' });
  }
  updateStatus(req.params.id, req.body.status);
  res.json({ success: true });
});

app.delete('/api/admin/submissions/:id', adminAuth, (_req, res) => {
  deleteSubmission(_req.params.id);
  res.json({ success: true });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Server → http://localhost:${PORT}`));
