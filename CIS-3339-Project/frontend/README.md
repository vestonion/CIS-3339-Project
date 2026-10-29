# Data Platform Frontend

This project uses Vue 3, Vite, Tailwind CSS, Pinia, and Vuelidate.

## Requirements

Install Node.js 18 or newer and npm.

## Project setup

From the repository folder, open a terminal and run:

```powershell
cd frontend
npm install
```

## Before startup

The frontend needs a running backend API to load or save project data.

Create a local file named `.env.local` in the `frontend` folder:

```env
VITE_ROOT_API=http://localhost:3000
```

Set `VITE_ROOT_API` to the backend API base URL you will use. The example above is for a backend running locally on port 3000.

Do not put passwords, database connection strings, or other private credentials in frontend environment variables. Vite exposes variables beginning with `VITE_` to the browser.

Restart the Vite server after changing an environment file.

## Run the development server

From the `frontend` folder:

```powershell
npm run dev
```

Open the local URL printed in the terminal, usually `http://localhost:5173`.

If the backend or database is unavailable, API-backed pages may show an error such as “Unable to reach the server.” The frontend can still start without MongoDB, but successful login and data searches require a working backend and database.

## Create and preview a production build

Build the frontend:

```powershell
npm run build
```

Vite writes the production files to `frontend/dist`.

Preview the production build locally:

```powershell
npm run serve
```

Open the preview URL printed in the terminal. To check client-side routing, open a nested route directly and refresh the page. The host must serve `index.html` for frontend routes that do not match a physical file.

## Deployment

The deployment host has not been selected yet. After the team selects and tests a host, document the exact host-specific deployment steps here.

The deployment must:

1. Serve the contents of `frontend/dist`.
2. Rewrite frontend routes that do not match a physical file to `index.html` so Vue Router can load them.
3. Set `VITE_ROOT_API` to the deployed backend API URL when building the frontend.
4. Configure the backend CORS settings to allow requests from the deployed frontend origin.

## Tests

There is no frontend `npm test` script configured at this time. To check that the frontend compiles, run `npm run build`.

## Environment variable

`VITE_ROOT_API` is the backend API base URL. Do not put passwords, database connection strings, private tokens, or other secrets in frontend environment variables.