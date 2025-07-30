const express = require('express');
const { hashPassword, comparePassword, generateToken } = require('../middleware/auth');
const database = require('../database');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, first, last, street_address, role = 'user' } = req.body;

    // Validate required fields
    if (!username || !password || !email || !first || !last) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await database.findOneInCollection('users', { username });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Check if email already exists
    const existingEmail = await database.findOneInCollection('users', { email });
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const newUser = {
      username,
      password: hashedPassword,
      email,
      first,
      last,
      street_address: street_address || '',
      role: role === 'admin' ? 'admin' : 'user' // Only allow admin if explicitly set
    };

    const user = await database.addToCollection('users', newUser);
    
    // Remove password from response
    const { password: _, ...userResponse } = user;
    
    res.status(201).json({ 
      message: 'User created successfully', 
      user: userResponse 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user
    const user = await database.findOneInCollection('users', { username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);
    
    // Remove password from response
    const { password: _, ...userResponse } = user;
    
    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;