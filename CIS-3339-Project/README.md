# Data Platform Project Setup

This project has been developed over time by students in the CIS 4339 course.

The current iteration is based on development done by:
* Jeremy Griffith and Edwin Charly in Spring of 2023
* Elliot Farmer Garcia, Agatha	Molski and Chris Blanco in Fall of 2022.

It was updated by CIS 3339 Group 14 (Fall 2026).

## Requirements

- Node.js 18 or newer and npm
- A MongoDB database (the team uses a remote MongoDB Atlas database)
- Two terminals: one for the backend, one for the frontend

The app has two parts:

| Folder | What it is | Default URL |
| --- | --- | --- |
| `backend` | Node/Express API with MongoDB | http://localhost:3000 |
| `frontend` | Vue 3 + Vite app | http://localhost:5173 |

## 1. Environment files

Each part has its own environment file. Do not mix them.

### `backend/.env`

See `backend/.env.example` and `backend/README.md`. Variable names:

| Variable | Purpose |
| --- | --- |
| `MONGO_URL` | MongoDB connection string (secret) |
| `PORT` | API port, `3000` |
| `ORG_ID` | The organization ObjectId every user and record belongs to |
| `JWT_SECRET` | Secret used to sign login tokens (secret) |
| `CORS_ORIGIN` | The one frontend origin allowed to call the API, `http://localhost:5173` |
| `SEED_VIEWER_USERNAME` / `SEED_VIEWER_PASSWORD` | Viewer demo account, `user` / `user` |
| `SEED_EDITOR_USERNAME` / `SEED_EDITOR_PASSWORD` | Editor demo account, `admin` / `admin` |

### `frontend/.env`

```env
VITE_ROOT_API=http://localhost:3000
```

`VITE_ROOT_API` is the backend API base URL. Anything starting with `VITE_` is public in the browser, so never put `MONGO_URL`, `JWT_SECRET`, passwords, or other secrets in the frontend `.env`.

If a `frontend/.env.local` file exists, Vite uses its value over `frontend/.env`. Keep both on the same URL.

## 2. Backend: install, initialize the database, start

```powershell
cd backend
npm install
npm run db:init
npm start
```

- `npm run db:init` creates the organization (`_id` = `ORG_ID`), the two demo accounts with bcrypt-hashed passwords, and sample data. It is safe to run more than once. It never deletes data.
- Check the API at http://localhost:3000/health. Expected: `{"status":"ok","db":"connected"}`.

## 3. Frontend: install and start (development)

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## 4. Demo accounts and roles

| Username | Password | Role | Can do |
| --- | --- | --- | --- |
| `admin` | `admin` | editor | View, create, update, delete, register/deregister clients for events |
| `user` | `user` | viewer | View and search only. Editor actions are blocked (backend returns 403) |

Every user only sees data for their own organization (`ORG_ID`).

## 5. Production build and preview

```powershell
cd frontend
npm run build
npm run serve
```

- `npm run build` writes the production files to `frontend/dist`.
- `npm run serve` serves that production build at http://localhost:5173 (the same origin as `CORS_ORIGIN`, so API calls are allowed).
- Stop `npm run dev` first. Both use port 5173.
- `VITE_ROOT_API` is read at build time. If you change it, run `npm run build` again.

### SPA fallback (nested routes)

Vue Router uses history mode, so URLs like `/clientdetails/<id>` are not real files. The server must send `index.html` for those paths.

- `npm run serve` (Vite preview) already does this. Open a nested page and refresh it to check.
- A static host needs a rewrite rule: all paths that are not a real file go to `/index.html`.

## 6. Deployment

Deployment target: the production build runs locally with `npm run build` + `npm run serve`, against the backend on `http://localhost:3000` and the team's remote MongoDB database.

To deploy to a host later:

1. Deploy the backend and set its `CORS_ORIGIN` to the deployed frontend origin (for example `https://your-frontend.example.com`).
2. Set `VITE_ROOT_API` in `frontend/.env` to the deployed backend URL, then run `npm run build`.
3. Serve `frontend/dist` and add the SPA rewrite to `/index.html`.

## 7. Known limitations

- `CORS_ORIGIN` allows one origin. Running the frontend on another port or host is blocked until `CORS_ORIGIN` is changed and the backend is restarted.
- Port 5173 must be free for `npm run dev` and `npm run serve`.
- The remote database must allow your network (MongoDB Atlas Network Access). Otherwise the backend stops at startup and `/health` is not reachable.
- There are no automated frontend tests. `npm run build` checks that the frontend compiles.

More detail: `backend/README.md` and `frontend/README.md`.
