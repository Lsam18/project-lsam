// Minimal admin server to append projects to assets/projects.json
// Requires: npm install express

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);

// Admin config - must be set in environment (no hardcoded defaults)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_COOKIE_SECRET = process.env.ADMIN_COOKIE_SECRET;
const ADMIN_ALLOWED_ORIGIN = process.env.ADMIN_ALLOWED_ORIGIN;
const ADMIN_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const VISITS_PATH = path.join(__dirname, 'assets', 'visits.json');

if (!ADMIN_PASSWORD || !ADMIN_COOKIE_SECRET) {
  console.error('Missing ADMIN_PASSWORD or ADMIN_COOKIE_SECRET. Set both environment variables before starting the server.');
  process.exit(1);
}

app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(ADMIN_COOKIE_SECRET));

function readVisitData() {
  try {
    const raw = fs.readFileSync(VISITS_PATH, 'utf8');
    const json = JSON.parse(raw);
    const count = Number(json && json.count);
    const uniqueTotal = Number(json && json.uniqueTotal);
    const seen = (json && json.seen && typeof json.seen === 'object') ? json.seen : {};
    return {
      count: Number.isFinite(count) && count >= 0 ? count : 0,
      uniqueTotal: Number.isFinite(uniqueTotal) && uniqueTotal >= 0 ? uniqueTotal : 0,
      seen
    };
  } catch (e) {
    return { count: 0, uniqueTotal: 0, seen: {} };
  }
}

function writeVisitData(data) {
  try {
    fs.writeFileSync(
      VISITS_PATH,
      JSON.stringify({
        count: data.count,
        uniqueTotal: data.uniqueTotal,
        seen: data.seen,
        updatedAt: new Date().toISOString()
      }, null, 2),
      'utf8'
    );
  } catch (e) {
    console.error('Failed to write visits:', e);
  }
}

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signToken(body) {
  return crypto.createHmac('sha256', ADMIN_COOKIE_SECRET).update(body).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function issueToken() {
  const payload = { exp: Date.now() + ADMIN_TOKEN_TTL_MS };
  const body = base64url(JSON.stringify(payload));
  const sig = signToken(body);
  return `${body}.${sig}`;
}

function verifyToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return false;
  const [body, sig] = parts;
  const expected = signToken(body);
  if (sig !== expected) return false;
  try {
    const json = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    if (!json.exp || Date.now() > json.exp) return false;
    return true;
  } catch (e) {
    return false;
  }
}

// CORS for admin frontend (optional)
app.use((req, res, next) => {
  if (ADMIN_ALLOWED_ORIGIN && req.headers.origin === ADMIN_ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ADMIN_ALLOWED_ORIGIN);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  next();
});

// Public visits endpoint CORS (no credentials)
app.use((req, res, next) => {
  if (req.path === '/api/visits') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  next();
});

// Protect admin page and project API endpoints. If not authenticated, send a login page
app.use((req, res, next) => {
  const p = req.path || '';
  // allow login page and login/logout endpoints without auth
  if (p === '/admin-login.html' || p === '/admin/login' || p === '/admin/logout') return next();

  // protect admin UI and project APIs
  if (p === '/admin.html' || p.startsWith('/api/projects') || p === '/admin/check') {
    const cookieOk = req.signedCookies && req.signedCookies.admin_auth === '1';
    const authHeader = req.get('authorization') || '';
    const tokenOk = authHeader.startsWith('Bearer ') && verifyToken(authHeader.slice(7).trim());
    if (cookieOk || tokenOk) return next();
    // API requests should get JSON 401
    if (p.startsWith('/api/') || p === '/admin/check') return res.status(401).json({ ok: false, error: 'Unauthorized' });
    // otherwise redirect to login page
    return res.redirect('/admin-login.html');
  }

  return next();
});

// Serve static after auth middleware so admin.html can be intercepted above
app.use(express.static(path.join(__dirname)));

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Server running' });
});

// Public visit counter
app.get('/api/visits', (req, res) => {
  const data = readVisitData();
  res.json({ ok: true, count: data.count, unique: data.uniqueTotal });
});

app.post('/api/visits', (req, res) => {
  const data = readVisitData();
  const ip = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim();
  const ua = (req.headers['user-agent'] || '').toString();
  const fingerprint = crypto.createHash('sha256').update(`${ip}|${ua}`).digest('hex');

  if (!data.seen[fingerprint]) {
    data.seen[fingerprint] = Date.now();
    data.uniqueTotal += 1;
  }

  data.count += 1;
  writeVisitData(data);
  res.json({ ok: true, count: data.count, unique: data.uniqueTotal });
});

// Auth check for admin UI
app.get('/admin/check', (req, res) => {
  res.json({ ok: true });
});

// Admin login handler (form posts here)
app.post('/admin/login', (req, res) => {
  const password = (req.body && req.body.password) ? String(req.body.password) : '';
  const wantsJson = (req.get('accept') || '').includes('application/json') || (req.get('content-type') || '').includes('application/json');
  if (!password) {
    if (wantsJson) return res.status(400).json({ ok: false, error: 'Missing password' });
    return res.redirect('/admin-login.html?error=missing');
  }
  if (password === ADMIN_PASSWORD) {
    // set signed cookie for 1 day
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.cookie('admin_auth', '1', {
      signed: true,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: isSecure ? 'None' : 'Lax',
      secure: isSecure
    });
    if (wantsJson) return res.json({ ok: true, token: issueToken() });
    return res.redirect('/admin.html');
  }
  if (wantsJson) return res.status(401).json({ ok: false, error: 'Invalid password' });
  return res.redirect('/admin-login.html?error=invalid');
});

app.get('/admin/logout', (req, res) => {
  res.clearCookie('admin_auth');
  res.redirect('/admin-login.html?msg=loggedout');
});

// Return projects (for admin UI use)
app.get('/api/projects', (req, res) => {
  const jsonPath = path.join(__dirname, 'assets', 'projects.json');
  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const projects = JSON.parse(raw);
    res.json(projects);
  } catch (err) {
    console.error('Error reading projects:', err);
    res.status(500).json({ ok: false, error: 'Failed to read projects' });
  }
});

// Add new project (no auth for now as requested)
app.post('/api/projects', (req, res) => {
  const payload = req.body;

  // Normalize incoming categories: accept comma-separated string or array
  if (payload.category && !payload.categories) {
    payload.categories = Array.isArray(payload.category) ? payload.category : String(payload.category).split(',').map(s => s.trim()).filter(Boolean);
    delete payload.category;
  }

  if (!payload.categories) payload.categories = [];

  // Basic validation
  if (!payload || typeof payload !== 'object') return res.status(400).json({ ok: false, error: 'Invalid payload' });
  if (!payload.title || typeof payload.title !== 'string') return res.status(400).json({ ok: false, error: 'Missing title' });
  if (!payload.description || typeof payload.description !== 'string') return res.status(400).json({ ok: false, error: 'Missing description' });

  // Ensure categories array
  if (!Array.isArray(payload.categories)) payload.categories = [String(payload.categories)];

  // Assign id if missing
  if (!payload.id) {
    payload.id = crypto.randomBytes(8).toString('hex');
  }

  const jsonPath = path.join(__dirname, 'assets', 'projects.json');
  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const projects = JSON.parse(raw);

    // prepend new project
    const updated = [payload, ...projects];

    // backup
    const bakPath = jsonPath + '.' + Date.now() + '.bak';
    fs.writeFileSync(bakPath, raw, 'utf8');

    fs.writeFileSync(jsonPath, JSON.stringify(updated, null, 2), 'utf8');

    res.json({ ok: true, backup: path.basename(bakPath), id: payload.id });
  } catch (err) {
    console.error('Error updating projects:', err);
    res.status(500).json({ ok: false, error: 'Failed to update projects file' });
  }
});

// Update existing project by id
app.put('/api/projects/:id', (req, res) => {
  const id = req.params.id;
  const payload = req.body;
  const jsonPath = path.join(__dirname, 'assets', 'projects.json');
  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const projects = JSON.parse(raw);
    const idx = projects.findIndex(p => String(p.id) === String(id));
    if (idx === -1) return res.status(404).json({ ok: false, error: 'Project not found' });

    // Normalize categories similar to POST
    if (payload.category && !payload.categories) {
      payload.categories = Array.isArray(payload.category) ? payload.category : String(payload.category).split(',').map(s => s.trim()).filter(Boolean);
      delete payload.category;
    }
    if (payload.categories && !Array.isArray(payload.categories)) payload.categories = [String(payload.categories)];

    // Merge fields (preserve id)
    const updated = Object.assign({}, projects[idx], payload, { id: projects[idx].id });

    const newProjects = projects.slice();
    newProjects[idx] = updated;

    // backup
    const bakPath = jsonPath + '.' + Date.now() + '.bak';
    fs.writeFileSync(bakPath, raw, 'utf8');

    fs.writeFileSync(jsonPath, JSON.stringify(newProjects, null, 2), 'utf8');
    res.json({ ok: true, backup: path.basename(bakPath), id: updated.id });
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ ok: false, error: 'Failed to update project' });
  }
});

// Delete a project by id
app.delete('/api/projects/:id', (req, res) => {
  const id = req.params.id;
  const jsonPath = path.join(__dirname, 'assets', 'projects.json');
  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const projects = JSON.parse(raw);
    const idx = projects.findIndex(p => String(p.id) === String(id));
    if (idx === -1) return res.status(404).json({ ok: false, error: 'Project not found' });

    const newProjects = projects.slice();
    newProjects.splice(idx, 1);

    // backup
    const bakPath = jsonPath + '.' + Date.now() + '.bak';
    fs.writeFileSync(bakPath, raw, 'utf8');

    fs.writeFileSync(jsonPath, JSON.stringify(newProjects, null, 2), 'utf8');
    res.json({ ok: true, backup: path.basename(bakPath), id });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ ok: false, error: 'Failed to delete project' });
  }
});

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
});