// API endpoints for interacting with the users collection
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { users } = require('../models/models');

// API endpoint to handle login
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  // Validate login input
  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !username.trim() ||
    !password
  ) {
    return res.status(400).json({
      error: 'Username and password are required'
    });
  }

  try {
    // Find the user within the configured organization
    const user = await users.findOne({
      username: username,
      org: process.env.ORG_ID
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid username or password'
      });
    }

    // Compare the submitted password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid username or password'
      });
    }

    // Validate the user's organization and role
    const role = user.role.toLowerCase();

    if (!user.org || !['editor', 'viewer'].includes(role)) {
      return res.status(401).json({
        error: 'Invalid account configuration'
      });
    }

    // Create the JWT payload using trusted database information
    const payload = {
      sub: user._id.toString(),
      username: user.username,
      name: user.name || user.username,
      role: role,
      orgId: user.org.toString()
    };

    // Generate the JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.json({ token });

  } catch (err) {
    res.status(500).json({
      error: 'Server error'
    });
  }
});

module.exports = router;