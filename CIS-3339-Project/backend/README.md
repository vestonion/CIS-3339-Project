# Backend

This implementation is for NodeJS based on [Express](https://expressjs.com/) and [MongoDB](https://www.mongodb.com/) and uses [mongoose](https://mongoosejs.com/) as the ODM.

## Quick start

From a clean checkout with Node.js installed:

    cd backend
    npm install
    npm run db:init
    npm start

Then open <http://localhost:3000/health>. You should see:

    {"status":"ok","db":"connected"}

Demo logins created by `npm run db:init`:

| Username | Password | Role   |
| -------- | -------- | ------ |
| user     | user     | viewer |
| admin    | admin    | editor |

## 1. Configure `backend/.env`

Create `backend/.env` (see `.env.example`) with exactly these names:

    MONGO_URL=<course-project remote connection string>
    PORT=3000
    ORG_ID=<stable organization ObjectId>
    JWT_SECRET=<course-project-only secret>
    CORS_ORIGIN=http://localhost:5173
    SEED_VIEWER_USERNAME=user
    SEED_VIEWER_PASSWORD=user
    SEED_EDITOR_USERNAME=admin
    SEED_EDITOR_PASSWORD=admin

Notes:

- `MONGO_URL` must select the course database, e.g.
  `mongodb+srv://<user>:<password>@<cluster-host>/<database>?retryWrites=true&w=majority`.
  URL-encode special characters in the username or password.
- `ORG_ID` is a 24-character hex ObjectId. `db:init` creates the
  organization with exactly this `_id`. Every member must use the same value.
- `CORS_ORIGIN` is the one frontend origin allowed to call the API
  (`*` is rejected). For a deployed frontend, use its real origin.
- Never put `MONGO_URL`, `JWT_SECRET`, or database credentials in the
  frontend `.env`.

## 2. Remote database (MongoDB Atlas)

1. Use a cluster dedicated to this class project.
2. Create a database user with read/write on the course database only.
3. Network Access: allow the team's IPs and the grader's access path.
   If broad access (`0.0.0.0/0`) is required, keep a project-only user and
   rotate or disable it after grading.
4. Paste the connection string into `MONGO_URL` in `backend/.env`.

You do not need to create collections by hand. `db:init` creates them
from the existing Mongoose models.

## 3. Initialize the database

    npm run db:init

This command (`scripts/dbInit.js`):

- checks `.env` first and exits with an error if anything is missing
  or invalid (no writes happen in that case)
- upserts the organization `{ _id: ORG_ID, name: "Community Center" }`
- creates or repairs the two demo logins with bcrypt-hashed passwords
  (never plaintext), the correct role, and `org = ORG_ID`
- adds sample data if missing: 3 clients, 1 service ("Food Pantry"),
  and 1 event ("Community Health Fair") linked to the service with one
  registered client

It is safe to run again. It never drops the database or clears a
collection, and sample records use stable IDs derived from `ORG_ID`, so a
second run reports `exists` / `unchanged` and adds no duplicates.
Output shows only the database host, never the full URI or passwords.

## 4. Start the API

    npm start

The server checks its configuration, connects to MongoDB, and only then
starts listening on `PORT`. If the database cannot be reached at startup,
it prints the error (without the URI) and exits.

## Health check and errors

- `GET /health` is public (no token) and reports the live Mongoose
  connection: `"db":"connected"` or `"db":"disconnected"`.
- Errors use one JSON shape: `{ "error": "Human readable message" }`
  - 400: invalid input (schema validation, bad ID, malformed JSON)
  - 404: missing record or unknown route
  - 500: unexpected server error (no stack traces or raw Mongo errors)
- Route handlers send errors to the central handler with `next(error)`.
  To send a 404 from a route:

      const e = new Error('Event not found');
      e.statusCode = 404;
      return next(e);

## Postman Documentation

More details about the API endpoints can be be found at <https://documenter.getpostman.com/view/25012176/2s9Y5Zv1xz>
