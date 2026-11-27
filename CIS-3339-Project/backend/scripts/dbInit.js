// Database initializer for the CIS 3339 Data Platform backend.
//
// Usage (from the backend folder):
//   npm run db:init
//
// What it does:
//   - Validates the backend .env configuration before any write.
//   - Upserts the organization whose _id equals ORG_ID.
//   - Upserts the two demo logins (viewer + editor) with bcrypt hashes.
//   - Inserts a few sample clients, one service, and one event (with a
//     registered sample client) if they do not already exist.
//
// It is repeatable and non-destructive: it never drops the database,
// never clears a collection, and uses stable IDs derived from ORG_ID so a
// second run does not create duplicates. Existing sample records are left
// as they are (only missing ones are created).

const path = require('path');
const crypto = require('crypto');

// Load backend/.env no matter which folder the command is run from
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { orgs, users, clients, services, events } = require('../models/models');

const SALT_ROUNDS = 10;
const ORG_NAME = 'Community Center';

// ---------------------------------------------------------------------------
// 1. Configuration checks (no database writes happen before these pass)
// ---------------------------------------------------------------------------
const REQUIRED_VARS = [
  'MONGO_URL',
  'ORG_ID',
  'JWT_SECRET',
  'SEED_VIEWER_USERNAME',
  'SEED_VIEWER_PASSWORD',
  'SEED_EDITOR_USERNAME',
  'SEED_EDITOR_PASSWORD'
];

function validateConfig() {
  const problems = [];

  REQUIRED_VARS.forEach((name) => {
    if (!process.env[name] || !process.env[name].trim()) {
      problems.push(`${name} is missing or empty`);
    }
  });

  const url = process.env.MONGO_URL || '';
  if (url && !/^mongodb(\+srv)?:\/\//.test(url)) {
    problems.push('MONGO_URL must start with mongodb:// or mongodb+srv://');
  }
  if (/[<>]/.test(url)) {
    problems.push('MONGO_URL still contains <placeholder> text');
  }

  const orgId = process.env.ORG_ID || '';
  if (orgId && !/^[a-fA-F0-9]{24}$/.test(orgId)) {
    problems.push('ORG_ID must be a 24-character hex MongoDB ObjectId');
  }

  if (
    process.env.SEED_VIEWER_USERNAME &&
    process.env.SEED_VIEWER_USERNAME === process.env.SEED_EDITOR_USERNAME
  ) {
    problems.push('SEED_VIEWER_USERNAME and SEED_EDITOR_USERNAME must differ');
  }

  return problems;
}

// Show only the host part of the connection string (no user, password, or query)
function describeMongoHost(url) {
  const match = url.match(/^mongodb(?:\+srv)?:\/\/(?:[^@/]*@)?([^/?]+)/);
  return match ? match[1] : '(unparsed host)';
}

// Stable ObjectId for a sample record, derived from ORG_ID + a fixed key.
// Same ORG_ID + same key => same _id on every run (prevents duplicates).
function stableId(key) {
  const hex = crypto
    .createHash('sha1')
    .update(`${process.env.ORG_ID}:${key}`)
    .digest('hex')
    .slice(0, 24);
  return new mongoose.Types.ObjectId(hex);
}

// ---------------------------------------------------------------------------
// 2. Seed helpers
// ---------------------------------------------------------------------------

// Insert the document only if no document with this _id exists yet.
// Validates against the existing Mongoose schema before writing.
// Returns 'created' or 'exists'.
async function insertIfMissing(Model, doc) {
  await new Model(doc).validate();
  const result = await Model.updateOne(
    { _id: doc._id },
    { $setOnInsert: doc },
    { upsert: true }
  );
  return result.upsertedCount > 0 ? 'created' : 'exists';
}

// Make sure a login exists in this org with the right role and password.
// Re-hashes only if the stored hash no longer matches the .env password,
// so repeated runs leave a correct account untouched.
async function upsertUser(username, password, role, orgId) {
  const existing = await users.find({ username, org: orgId });

  if (existing.length > 1) {
    console.warn(
      `  ! Warning: ${existing.length} users named "${username}" exist in this org. ` +
        'Login uses the first match; remove the extras manually.'
    );
  }

  const user = existing[0];

  if (!user) {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const doc = {
      _id: stableId(`user:${username}`),
      username,
      password: hash,
      role,
      org: orgId
    };
    await new users(doc).validate();
    await users.create(doc);
    return 'created';
  }

  const passwordOk =
    typeof user.password === 'string' &&
    user.password.startsWith('$2') &&
    (await bcrypt.compare(password, user.password));

  const update = {};
  if (!passwordOk) update.password = await bcrypt.hash(password, SALT_ROUNDS);
  if (user.role !== role) update.role = role;

  if (Object.keys(update).length === 0) return 'unchanged';

  await users.updateOne({ _id: user._id }, { $set: update });
  return 'updated';
}

// ---------------------------------------------------------------------------
// 3. Main
// ---------------------------------------------------------------------------
async function main() {
  const problems = validateConfig();
  if (problems.length) {
    console.error('db:init stopped - fix backend/.env first:');
    problems.forEach((p) => console.error(`  - ${p}`));
    process.exit(1);
  }

  const orgId = new mongoose.Types.ObjectId(process.env.ORG_ID);

  console.log('db:init starting');
  console.log(`  Mongo host: ${describeMongoHost(process.env.MONGO_URL)}`);
  console.log(`  ORG_ID:     ${process.env.ORG_ID}`);

  mongoose.set('strictQuery', false);
  await mongoose.connect(process.env.MONGO_URL, {
    serverSelectionTimeoutMS: 15000
  });
  console.log(`  Database:   ${mongoose.connection.name}`);

  const summary = [];

  // Organization (upsert by _id = ORG_ID; existing name is kept)
  await new orgs({ _id: orgId, name: ORG_NAME }).validate();
  const orgResult = await orgs.updateOne(
    { _id: orgId },
    { $setOnInsert: { name: ORG_NAME } },
    { upsert: true }
  );
  summary.push(['org', orgResult.upsertedCount > 0 ? 'created' : 'exists']);

  // Demo logins
  summary.push([
    `user "${process.env.SEED_VIEWER_USERNAME}" (viewer)`,
    await upsertUser(
      process.env.SEED_VIEWER_USERNAME,
      process.env.SEED_VIEWER_PASSWORD,
      'viewer',
      orgId
    )
  ]);
  summary.push([
    `user "${process.env.SEED_EDITOR_USERNAME}" (editor)`,
    await upsertUser(
      process.env.SEED_EDITOR_USERNAME,
      process.env.SEED_EDITOR_PASSWORD,
      'editor',
      orgId
    )
  ]);

  // Sample clients (schema requires firstName, lastName,
  // phoneNumber.primary, address.city, and a non-empty orgs array)
  const sampleClients = [
    {
      _id: stableId('client:1'),
      firstName: 'Maria',
      lastName: 'Lopez',
      email: 'maria.lopez@example.com',
      phoneNumber: { primary: '7135550101' },
      address: {
        line1: '100 Main St',
        city: 'Houston',
        county: 'Harris',
        zip: '77002'
      },
      orgs: [orgId]
    },
    {
      _id: stableId('client:2'),
      firstName: 'James',
      lastName: 'Nguyen',
      email: 'james.nguyen@example.com',
      phoneNumber: { primary: '7135550102' },
      address: {
        line1: '200 Bellaire Blvd',
        city: 'Houston',
        county: 'Harris',
        zip: '77036'
      },
      orgs: [orgId]
    },
    {
      _id: stableId('client:3'),
      firstName: 'Aisha',
      lastName: 'Johnson',
      email: 'aisha.johnson@example.com',
      phoneNumber: { primary: '2815550103' },
      address: {
        line1: '300 Bay Area Blvd',
        city: 'Pasadena',
        county: 'Harris',
        zip: '77504'
      },
      orgs: [orgId]
    }
  ];

  for (const c of sampleClients) {
    summary.push([
      `client ${c.firstName} ${c.lastName}`,
      await insertIfMissing(clients, c)
    ]);
  }

  // Sample service
  const sampleService = {
    _id: stableId('service:1'),
    name: 'Food Pantry',
    description: 'Weekly grocery distribution for registered clients',
    status: 'Active',
    org: orgId
  };
  summary.push([
    `service ${sampleService.name}`,
    await insertIfMissing(services, sampleService)
  ]);

  // Sample event linked to the service and with one registered client
  const sampleEvent = {
    _id: stableId('event:1'),
    org: orgId,
    name: 'Community Health Fair',
    services: [sampleService._id],
    date: new Date('2026-12-12T15:00:00Z'),
    address: {
      line1: '100 Main St',
      city: 'Houston',
      county: 'Harris',
      zip: '77002'
    },
    description: 'Free screenings and service sign-ups',
    attendees: [sampleClients[0]._id]
  };
  summary.push([
    `event ${sampleEvent.name}`,
    await insertIfMissing(events, sampleEvent)
  ]);

  console.log('db:init complete:');
  summary.forEach(([what, result]) =>
    console.log(`  ${what.padEnd(34)} ${result}`)
  );
}

main()
  .then(() => mongoose.disconnect())
  .then(() => process.exit(0))
  .catch(async (err) => {
    // Log only the error type and message (never the URI or passwords)
    console.error(`db:init failed: ${err.name}: ${err.message}`);
    try {
      await mongoose.disconnect();
    } catch (e) {
      // ignore disconnect errors during failure handling
    }
    process.exit(1);
  });
