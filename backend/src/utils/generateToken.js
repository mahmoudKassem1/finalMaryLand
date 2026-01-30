const jwt = require('jsonwebtoken');

/**
 * Generates a JWT for a Client
 * @param {string} id - The User ID from MongoDB
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Client sessions last 30 days
  });
};

module.exports = generateToken;