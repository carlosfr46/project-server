const express = require('express');
const { authenticateToken, requireAdmin, requireOwnerOrAdmin, hashPassword } = require('../middleware/auth');
const database = require('../database');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await database.getCollection('users');
    // Remove passwords from response
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user (admin or own user)
router.get('/:username', authenticateToken, requireOwnerOrAdmin, async (req, res) => {
  try {
    const user = await database.findOneInCollection('users', { username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (admin or own user)
router.patch('/:username', authenticateToken, requireOwnerOrAdmin, async (req, res) => {
  try {
    const { email, first, last, street_address, password, role } = req.body;
    
    const updates = {};
    if (email !== undefined) updates.email = email;
    if (first !== undefined) updates.first = first;
    if (last !== undefined) updates.last = last;
    if (street_address !== undefined) updates.street_address = street_address;
    
    // Only admin can change roles
    if (role !== undefined && req.user.role === 'admin') {
      updates.role = role;
    }
    
    // Hash password if provided
    if (password !== undefined) {
      updates.password = await hashPassword(password);
    }
    
    const user = await database.updateInCollection('users', req.params.username, updates);
    
    // Remove password from response
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.message === 'Item not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:username', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await database.getCollection('users');
    const userIndex = users.findIndex(u => u.username === req.params.username);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    users.splice(userIndex, 1);
    await database.updateCollection('users', users);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;