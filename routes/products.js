const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const database = require('../database');

const router = express.Router();

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const products = await database.getCollection('products');
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Search products by name or category (public)
router.get('/search', async (req, res) => {
  try {
    const { name, category } = req.query;
    const products = await database.getCollection('products');
    
    let filteredProducts = products;
    
    if (name) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(name.toLowerCase())
      );
    }
    
    if (category) {
      filteredProducts = filteredProducts.filter(product =>
        product.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    res.json(filteredProducts);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// Get single product (public)
router.get('/:id', async (req, res) => {
  try {
    const product = await database.findOneInCollection('products', { id: req.params.id });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, price, category, on_hand, description } = req.body;
    
    if (!name || price === undefined || !category || on_hand === undefined) {
      return res.status(400).json({ error: 'Missing required fields: name, price, category, on_hand' });
    }
    
    const newProduct = {
      name,
      price: parseFloat(price),
      category,
      on_hand: parseInt(on_hand),
      description: description || ''
    };
    
    const product = await database.addToCollection('products', newProduct);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (admin only)
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, price, category, on_hand, description } = req.body;
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = parseFloat(price);
    if (category !== undefined) updates.category = category;
    if (on_hand !== undefined) updates.on_hand = parseInt(on_hand);
    if (description !== undefined) updates.description = description;
    
    const product = await database.updateInCollection('products', req.params.id, updates);
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.message === 'Item not found') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await database.deleteFromCollection('products', req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    if (error.message === 'Item not found') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;