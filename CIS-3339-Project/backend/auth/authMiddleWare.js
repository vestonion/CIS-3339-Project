const jwt = require('jsonwebtoken');

// Authenticate the user by verifying their JWT
function requireAuth(req, res, next) {
  const authorization = req.header('Authorization');
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return res.status(401).json({
      error: 'Missing or invalid authorization token'
    });
  }

  const token = match[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check that the token contains valid role and organization claims
    if (
      !decoded ||
      !['editor', 'viewer'].includes(decoded.role) ||
      typeof decoded.orgId !== 'string' ||
      !/^[a-fA-F0-9]{24}$/.test(decoded.orgId)
    ) {
      return res.status(401).json({
        error: 'Token is missing required claims or has invalid claims'
      });
    }

    req.user = decoded;
  } catch (err) {
    return res.status(401).json({
      error: 'Token is not valid'
    });
  }

  next();
}

// Check whether the authenticated user has the required role
function requireRole(role) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    next();
  };
}

// Restrict database queries to the authenticated user's organization
function withOrg(filter, req, field = 'org') {
  if (!req.user?.orgId) {
    throw new Error('Authenticated organization is required');
  }

  return {
    ...filter,
    [field]: req.user.orgId
  };
}

// Preserve compatibility with existing Sprint 2 imports
module.exports = requireAuth;

// Named exports for Sprint 3
module.exports.requireAuth = requireAuth;
module.exports.requireRole = requireRole;
module.exports.withOrg = withOrg;