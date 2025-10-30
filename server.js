// Minimal admin server to append projects to assets/projects.json
// Requires: npm install express

const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin config - set ADMIN_PASSWORD and ADMIN_COOKIE_SECRET in the environment for production
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_COOKIE_SECRET = process.env.ADMIN_COOKIE_SECRET || 'please-change-this-secret';

app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(ADMIN_COOKIE_SECRET));

// Protect admin page and project API endpoints. If not authenticated, send a login page
app.use((req, res, next) => {
  const p = req.path || '';
  // allow login page and login/logout endpoints without auth
  if (p === '/admin-login.html' || p === '/admin/login' || p === '/admin/logout') return next();

  // protect admin UI and project APIs
  if (p === '/admin.html' || p.startsWith('/api/projects')) {
    if (req.signedCookies && req.signedCookies.admin_auth === '1') return next();
    // API requests should get JSON 401
    if (p.startsWith('/api/')) return res.status(401).json({ ok: false, error: 'Unauthorized' });
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

// Admin login handler (form posts here)
app.post('/admin/login', (req, res) => {
  const password = (req.body && req.body.password) ? String(req.body.password) : '';
  if (!password) return res.redirect('/admin-login.html?error=missing');
  if (password === ADMIN_PASSWORD) {
    // set signed cookie for 1 day
    res.cookie('admin_auth', '1', { signed: true, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    return res.redirect('/admin.html');
  }
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
    payload.id = require('crypto').randomBytes(8).toString('hex');
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