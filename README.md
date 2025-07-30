# RESTful Express Server

A comprehensive RESTful API server built with Node.js and Express, featuring JWT authentication, role-based access control, and a file-based JSON database.

## Features

- **Authentication**: JWT-based authentication with username/password
- **Authorization**: Role-based access control (admin/user)
- **Database**: File-based JSON database with products, users, and orders collections
- **Security**: Password hashing, rate limiting, CORS, and security headers
- **Product Management**: Full CRUD operations with search functionality
- **Order Management**: Checkout system with inventory management
- **User Management**: User registration and profile management

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. The server will run on http://localhost:3000

## Default Credentials

- **Admin**: username: `admin`, password: `secret`
- **User**: username: `user1`, password: `secret`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Products (GET is public, others require admin)
- `GET /api/products` - Get all products
- `GET /api/products/search?name=...&category=...` - Search products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PATCH /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Users (admin or own user access)
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:username` - Get user profile
- `PATCH /api/users/:username` - Update user profile
- `DELETE /api/users/:username` - Delete user (admin)

### Orders
- `GET /api/orders` - Get all orders (admin)
- `GET /api/orders/my-orders` - Get current user's orders
- `GET /api/orders/user/:username` - Get user orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders/checkout` - Place new order
- `PATCH /api/orders/:id` - Update order (admin)
- `DELETE /api/orders/:id` - Delete order (admin)

## Example Usage

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "secret"}'
```

### Search Products
```bash
curl "http://localhost:3000/api/products/search?category=Electronics"
```

### Checkout
```bash
curl -X POST http://localhost:3000/api/orders/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "items": [
      {"product_id": "1", "quantity": 1},
      {"product_id": "2", "quantity": 2}
    ],
    "ship_address": "123 Main St, City, State"
  }'
```

## Database Schema

### Products
- id, name, price, category, on_hand, description

### Users  
- username, street_address, email, password, first, last, role

### Orders
- id, username, order_date, ship_address, items[], total_amount, payment_id

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 minutes)
- CORS enabled
- Security headers with Helmet
- Role-based access control
- Input validation and sanitization