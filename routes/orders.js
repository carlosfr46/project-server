const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const database = require('../database');

const router = express.Router();

// Get all orders (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orders = await database.getCollection('orders');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get user's orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const orders = await database.findInCollection('orders', { username: req.user.username });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get orders by username (admin or own orders)
router.get('/user/:username', authenticateToken, async (req, res) => {
  try {
    // Check if user can access these orders
    if (req.user.role !== 'admin' && req.user.username !== req.params.username) {
      return res.status(403).json({ error: 'Access denied: can only access your own orders' });
    }
    
    const orders = await database.findInCollection('orders', { username: req.params.username });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await database.findOneInCollection('orders', { id: req.params.id });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check if user can access this order
    if (req.user.role !== 'admin' && req.user.username !== order.username) {
      return res.status(403).json({ error: 'Access denied: can only access your own orders' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Checkout - create new order
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const { items, ship_address } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required and cannot be empty' });
    }
    
    if (!ship_address) {
      return res.status(400).json({ error: 'Shipping address is required' });
    }
    
    // Validate and process items
    const products = await database.getCollection('products');
    const orderItems = [];
    let totalAmount = 0;
    
    for (const item of items) {
      const { product_id, quantity } = item;
      
      if (!product_id || !quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Each item must have product_id and positive quantity' });
      }
      
      const product = products.find(p => p.id === product_id);
      if (!product) {
        return res.status(400).json({ error: `Product ${product_id} not found` });
      }
      
      if (product.on_hand < quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${product.name}. Available: ${product.on_hand}, Requested: ${quantity}` 
        });
      }
      
      const itemTotal = product.price * quantity;
      totalAmount += itemTotal;
      
      orderItems.push({
        product_id,
        quantity,
        price: product.price
      });
      
      // Update product inventory
      product.on_hand -= quantity;
    }
    
    // Simulate credit card processing
    const paymentResult = simulatePayment(totalAmount);
    if (!paymentResult.success) {
      return res.status(402).json({ error: 'Payment failed: ' + paymentResult.error });
    }
    
    // Create order
    const newOrder = {
      username: req.user.username,
      order_date: new Date().toISOString(),
      ship_address,
      items: orderItems,
      total_amount: totalAmount,
      payment_id: paymentResult.payment_id
    };
    
    const order = await database.addToCollection('orders', newOrder);
    
    // Update product inventory in database
    await database.updateCollection('products', products);
    
    res.status(201).json({
      message: 'Order placed successfully',
      order,
      payment: paymentResult
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// Update order (admin only)
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { ship_address, items } = req.body;
    
    const updates = {};
    if (ship_address !== undefined) updates.ship_address = ship_address;
    if (items !== undefined) updates.items = items;
    
    const order = await database.updateInCollection('orders', req.params.id, updates);
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    if (error.message === 'Item not found') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await database.deleteFromCollection('orders', req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    if (error.message === 'Item not found') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Simulate payment processing
function simulatePayment(amount) {
  // Simulate random payment success/failure
  const success = Math.random() > 0.05; // 95% success rate
  
  if (success) {
    return {
      success: true,
      payment_id: 'pay_' + Math.random().toString(36).substr(2, 9),
      amount,
      status: 'completed'
    };
  } else {
    return {
      success: false,
      error: 'Payment declined - insufficient funds'
    };
  }
}

module.exports = router;