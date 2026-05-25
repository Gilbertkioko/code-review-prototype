# Code review sprint — //kood prototype

A full-stack **SvelteKit** app for structured peer code review: submitters finish a sprint task and share a Gitea repo; admins pair two reviewers; the trio moves through **testing → code review → standup → accept → 360° feedback** with live sync (Socket.IO) and persistence (libSQL / Turso).

For a plain-language walkthrough of each role, see **[USER-GUIDE.md](./USER-GUIDE.md)**.

---

## What this is

| Layer | Choice |
|--------|--------|
| UI | Svelte 5, SvelteKit 2, Tailwind CSS 4 |
| Auth | [Lucia](https://lucia-auth.com/) + Argon2 |
| Database | SQLite via [libSQL](https://github.com/tursodatabase/libsql) (local file or [Turso](https://turso.tech)) |
| ORM | [Drizzle](https://orm.drizzle.team/) |
| Realtime | Socket.IO (dev plugin + `server.js` in production) |
| Deploy | [Fly.io](https://fly.io) (`adapter-node`, Docker) |

**Roles:** `admin`, `submitter`, `reviewer`. Only submitter and reviewer can self-register; admin is granted in the database (see below).

---

## Prerequisites

- **Node.js** `>= 20.18.0 < 21` (see `.node-version` / `package.json` engines; [Volta](https://volta.sh) pin: `20.18.3`)
- **npm** (lockfile is `package-lock.json`)

Optional for production DB: a [Turso](https://turso.tech) database and auth token.

---

## Local setup

### 1. Clone and install

```sh
git clone git@github.com:Gilbertkioko/code-review-prototype.git
cd code-review-prototype
npm install
```

### 2. Environment

Copy the example env file and adjust if needed:

```sh
cp .env.example .env
```

For **local development**, the default is a file database (no Turso required):

```env
DATABASE_URL=./data/local.db
```

The app creates the `data/` directory when needed. Push the schema once:

```sh
npm run db:push
```

Optional checks:

```sh
npm run db:ping    # connectivity smoke test
npm run db:studio  # Drizzle Studio (GUI)
```

### 3. Run the dev server

```sh
npm run dev
```

Open **http://localhost:5173**. Sign up at `/signup` as **submitter** or **reviewer**, then log in at `/login`.

**Make yourself admin** (after your first signup), for example:

```sh
sqlite3 ./data/local.db "UPDATE user SET role = 'admin' WHERE lower(email) = lower('you@example.com');"
```

Log out and back in; admins are redirected to `/admin`.

### 4. Test multiple roles at once (optional)

Each browser session needs its own database file if you run several dev servers:

```sh
npm run db:push:b
npm run db:push:c
```

In separate terminals:

| Command | DB file | URL |
|---------|---------|-----|
| `npm run dev` | `data/local.db` | http://localhost:5173 |
| `npm run dev:b` | `data/local-b.db` | http://localhost:5174 |
| `npm run dev:c` | `data/local-c.db` | http://localhost:5175 |

Use different browsers or profiles so cookies do not clash.

### 5. Production-like run locally

```sh
npm run build
npm start
```

Listens on **http://localhost:3000** (see `server.js`). Set `DATABASE_URL` or Turso vars in `.env` before building if server modules need DB at build time (Fly uses in-memory SQLite during Docker build only).

---

## Environment variables

| Variable | When | Purpose |
|----------|------|---------|
| `DATABASE_URL` | Local | File path or `file:./data/local.db` |
| `TURSO_DATABASE_URL` | Production | `libsql://…` Turso URL |
| `TURSO_AUTH_TOKEN` | Production | Turso auth token |
| `ORIGIN` | Production | Public app URL (Lucia cookies, links), e.g. `https://code-review-sprint.fly.dev` |
| `PUBLIC_REALTIME_SOCKET` | Optional | Set to `0` to disable Socket.IO client |
| `PUBLIC_REALTIME_SSE` | Optional | `1` on single-node hosts if you use SSE fan-out |

See [.env.example](./.env.example) for full comments.

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server + Socket.IO dev plugin |
| `npm run build` | Production SvelteKit build |
| `npm start` | `node server.js` (SvelteKit + Socket.IO) |
| `npm run db:push` | Apply Drizzle schema to configured DB |
| `npm run db:nuke` | Delete local DB files and re-push schema |
| `npm run check` | `svelte-check` + sync |

---

## Running the deployed project

### Default hosting (Fly.io)

The repo is set up for **Fly.io** (`fly.toml`, GitHub Action on push to `main`).

1. **Open the app** in your browser. If the Fly app name is `code-review-sprint`, the URL is typically:

   **https://code-review-sprint.fly.dev**

   (Confirm with `fly status` or your team’s docs if the app name differs.)

2. **Sign up / log in** at `/signup` and `/login` like locally.

3. **Admin access** on production: promote your user in **Turso** (not via signup):

   ```sh
   turso db shell <your-db-name>
   ```

   ```sql
   UPDATE user SET role = 'admin' WHERE lower(email) = lower('you@example.com');
   ```

4. **Secrets** on Fly must include at least `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `ORIGIN` matching the public URL.

First-time deploy (maintainers):

```sh
fly auth login
fly apps create code-review-sprint   # or update `app` in fly.toml
fly secrets set TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." ORIGIN="https://code-review-sprint.fly.dev"
fly deploy
```

CI deploys from `main` using `FLY_API_TOKEN` (see [.github/workflows/fly-deploy.yml](./.github/workflows/fly-deploy.yml)).

**Socket.IO note:** Fly’s default HA uses multiple machines; in-memory Socket.IO breaks across VMs. This project deploys with **`--ha=false`** and expects **one machine** unless you add Redis/sticky sessions (see comments in `fly.toml`).

### Preview a production build without Fly

```sh
npm run start:preview
```

Serves on port **3000** with a built app (still needs DB env vars).

---

## Project layout

```
src/
  routes/              # SvelteKit routes (+page.server.ts actions)
    admin/             # Admin dashboard, users, per-project audit tabs
    login/, signup/
  lib/
    features/          # UI by domain (testing, code-review, briefing, shell, …)
    server/            # DB, auth, review workspace, realtime, AI review worker
    appState.svelte.ts # Client phase/UI state (localStorage + server sync)
drizzle/               # SQL migrations
scripts/               # DB helpers
server.js              # Production HTTP + Socket.IO entry
fly.toml, Dockerfile   # Fly deployment
```

**Review phases** (sidebar progress): Project completion → Testing → Code review → Standup → Accept project → 360° feedback.

**Code review categories** (split between reviewers by default):

- Reviewer A: Security, Correctness  
- Reviewer B: Performance, Structure & architecture  

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| `[db] Set TURSO_DATABASE_URL…` | Add `DATABASE_URL` or Turso vars to `.env` |
| Schema errors after pull | `npm run db:push` |
| Socket.IO 400 / disconnect on Fly | Ensure a single machine (`fly scale count 1`, deploy with `--ha=false`) |
| Admin menu missing | DB role must be `admin`; re-login after SQL update |
| Only one submitter allowed | By design: first `submitter` signup wins |

**Dev-only:** “Show demo jumps” (bottom-left) jumps phases or resets client demo state; production users follow the real workflow and server gates.

---

## Related docs

- **[USER-GUIDE.md](./USER-GUIDE.md)** — Non-technical journeys for Admin, Submitter, and two Reviewers  
- [SvelteKit docs](https://svelte.dev/docs/kit)  
- [Fly.io Node guide](https://fly.io/docs/languages-and-frameworks/node/)
