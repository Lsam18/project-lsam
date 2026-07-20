# Portfolio-26

This repository holds a personal portfolio site and a small admin UI for adding/updating projects.

## What it contains

- Static site: `index.html`, `about.html`, css, js and assets.
- Admin UI: `admin.html`, `admin-login.html`, and `js/admin.js` which provide an interface to add/edit projects.
- Simple Node/Express backend: `server.js` provides project CRUD endpoints at `/api/projects` and a minimal admin auth middleware.
- Projects data: `assets/projects.json` (and many `.bak` backups are present).

## Quick start (local)

1. Install dependencies

```bash
npm install
```

2. Set environment variables (recommended)

```bash
export ADMIN_PASSWORD='a-strong-password'
export ADMIN_COOKIE_SECRET='a-long-random-secret'
```

3. Start the server

```bash
npm start
```

4. Open the admin login locally

- http://localhost:3000/admin-login.html

Notes:
- The admin page and `/api/projects` are protected by a signed cookie set when you POST to `/admin/login` with the correct `ADMIN_PASSWORD`.
- The server writes project changes to `assets/projects.json` and creates a `.bak` file on each update.

## Verified threat intelligence

The portfolio's threat console uses named public sources and never generates attack routes or counters:

- `/api/threat-intel` relays and caches the official SANS ISC / DShield top-attacking-networks feed and the abuse.ch Feodo Tracker recommended C2 feed.
- The browser reads CISA's Known Exploited Vulnerabilities catalog and the current cyber-news RSS feed.
- `js/threat-snapshot.js` is a timestamped, verified provider capture used only when the page is opened with `file://` or an upstream feed is unavailable. The UI labels snapshot mode explicitly.
- Run the Node server (`npm start`) for automatic live provider refreshes. Static/file previews cannot bypass provider CORS restrictions, so they use the verified capture rather than fabricated data.

## Deployment notes

- The app requires a Node.js host (Express). You can deploy to a PaaS such as Render, Railway, Heroku, or a VPS.
- If you must host static-only (e.g., InfinityFree), either host the Node backend elsewhere and point the admin UI to it, or convert the admin endpoints to PHP (I can help with that).

## Security recommendations

- Use a strong `ADMIN_PASSWORD` and a long `ADMIN_COOKIE_SECRET`.
- Serve via HTTPS and set cookies to `secure` in production.
- Consider using server-side sessions and rate limiting for production.

## Repo & pushing

I prepared the repository locally and committed the files. To create a GitHub repo and push, you can use the GitHub CLI or regular git remote commands (examples below).

### Using GitHub CLI (recommended)

```bash
# create repo under your account and push current directory
gh repo create Lsam18/portfolio-26 --public --source=. --remote=origin --push
```

### Manual push (if you already created the repo on github.com)

```bash
git remote add origin git@github.com:Lsam18/portfolio-26.git
git branch -M main
git push -u origin main
```

If you want, I can try to create the GitHub repo and push it for you now (requires `gh` CLI and authentication). Otherwise, run the commands above locally.

---

If you'd like, I can also:
- Create a `Dockerfile` so the app can be deployed in a container.
- Add a `.env.example` and fail-fast checks if `ADMIN_PASSWORD` is missing.
- Convert the admin API to PHP for InfinityFree hosting.

Tell me what to do next.
