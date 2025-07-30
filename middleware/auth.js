const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const database = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await database.findOneInCollection('users', { username: decoded.username });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireOwnerOrAdmin = (req, res, next) => {
  const targetUsername = req.params.username || req.body.username;
  
  if (req.user.role === 'admin' || req.user.username === targetUsername) {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied: can only access your own data' });
  }
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const generateToken = (user) => {
  return jwt.sign(
    { username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnerOrAdmin,
  hashPassword,
  comparePassword,
  generateToken
};