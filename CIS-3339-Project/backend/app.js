// This is the main file for the backend

// import functionalities
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

const cors = require('cors');
// allow using a .env file
require('dotenv').config(); //require the dotenv

// check required configuration before starting (never print the values)
const REQUIRED_VARS = ['MONGO_URL', 'ORG_ID', 'JWT_SECRET', 'CORS_ORIGIN'];
const missingVars = REQUIRED_VARS.filter(
  (name) => !process.env[name] || !process.env[name].trim()
);
if (missingVars.length) {
  console.error(
    `Startup stopped - missing in backend/.env: ${missingVars.join(', ')}`
  );
  process.exit(1);
}
if (process.env.CORS_ORIGIN.trim() === '*') {
  console.error('Startup stopped - CORS_ORIGIN must be one origin, not *');
  process.exit(1);
}

// creates a new instance of express application
const app = express();

// add cors header to the server - only the configured frontend origin
app.use(
  cors({
    origin: process.env.CORS_ORIGIN.trim()
  })
);

// suppress mongoose warning to prepare for new version
mongoose.set('strictQuery', false);

// declare port number for the api
const PORT = process.env.PORT || 3000;

// setup and access request body
app.use(express.json());
app.use(morgan('dev'));

// public health check - no JWT required; reports the real mongoose state
app.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.json({ status: 'ok', db: connected ? 'connected' : 'disconnected' });
});

// setup middle ware for routes
app.use('/clients', require('./routes/clients'));
app.use('/events', require('./routes/events'));
app.use('/org', require('./routes/org'));
app.use('/services', require('./routes/services'));
app.use('/users', require('./routes/users'));

// unknown route
app.use(function (req, res) {
  res.status(404).json({ error: 'Route not found' });
});

// error handler - registered after all routes. Always returns
// { "error": "Human readable message" } and never a stack trace,
// raw Mongo error object, or secret.
// eslint-disable-next-line no-unused-vars
app.use(function (err, req, res, next) {
  let status = 500;
  let message = 'Internal server error';

  if (err.type === 'entity.parse.failed') {
    // malformed JSON request body
    status = 400;
    message = 'Invalid JSON in request body';
  } else if (err.name === 'ValidationError') {
    // mongoose schema validation failed
    status = 400;
    message = 'Invalid input: ' + Object.keys(err.errors || {}).join(', ');
  } else if (err.name === 'CastError') {
    // bad ObjectId or wrong type in a path/query value
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    // duplicate key
    status = 400;
    message = 'Duplicate record';
  } else if (err.name === 'DocumentNotFoundError') {
    status = 404;
    message = 'Record not found';
  } else {
    // a route deliberately set a client error status and message,
    // e.g. const e = new Error('Event not found'); e.statusCode = 404; next(e)
    const given = err.statusCode || err.status;
    if (given >= 400 && given < 500) {
      status = given;
      message = err.message || message;
    }
  }

  // log only what is useful for debugging (no headers, tokens, or bodies)
  console.error(
    `[${status}] ${req.method} ${req.originalUrl} - ${err.name}: ${err.message}`
  );

  if (res.headersSent) {
    return next(err);
  }
  res.status(status).json({ error: message });
});

// connect to MongoDB first, then start listening
mongoose
  .connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 15000 })
  .then(() => {
    console.log(
      `Database connection Success! (database: ${mongoose.connection.name})`
    );
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log(`CORS origin allowed: ${process.env.CORS_ORIGIN.trim()}`);
    });
  })
  .catch((err) => {
    // print only the error type and message, never the connection string
    console.error(`Mongo Connection Error - ${err.name}: ${err.message}`);
    process.exit(1);
  });

// report connection changes after startup (shown by GET /health as well)
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});
mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});
