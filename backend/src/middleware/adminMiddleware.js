const jwt = require('jsonwebtoken');

/**
 * ADMIN ACCESS GUARD
 * This middleware isolates the management panel from the client side.
 * It uses the high-security ADMIN_JWT_SECRET.
 */
const adminProtect = async (req, res, next) => {
  let token;

  // Check for the Bearer token in the Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // 1. Verify token using the Admin-specific Secret
      // This will automatically fail if a client-side token is used
      const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

      // 2. Double-check the role payload for extra security
      if (decoded.role === 'admin') {
        req.adminEmail = decoded.email;
        next();
      } else {
        // 403 Forbidden: Token is valid but the actor lacks permissions
        res.status(403).json({ message: 'Access Denied: You do not have administrative privileges.' });
      }
    } catch (error) {
      console.error('Admin Auth Error:', error.message);
      res.status(401).json({ message: 'Session expired or invalid. Please login to the management panel again.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Access Denied: No admin token provided.' });
  }
};

module.exports = { adminProtect };