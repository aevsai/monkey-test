# Application Context for Test Generation

## Overview
This is a web-based e-commerce platform built with React and Node.js that allows users to browse products, add items to cart, and complete purchases.

## Key Features
- User authentication (login/register)
- Product catalog with search and filtering
- Shopping cart management
- Checkout process with payment integration
- Order history and tracking
- Admin dashboard for inventory management

## Technical Stack
- Frontend: React 18, TypeScript, Tailwind CSS
- Backend: Node.js, Express, PostgreSQL
- Authentication: JWT tokens
- Payment: Stripe integration
- Deployment: Vercel (frontend), Railway (backend)

## User Workflows

### Shopping Flow
1. Browse product catalog
2. Use search/filter to find products
3. View product details
4. Add items to cart
5. Review cart and adjust quantities
6. Proceed to checkout
7. Enter shipping information
8. Complete payment
9. Receive order confirmation

### Admin Flow
1. Login to admin dashboard
2. View inventory levels
3. Add/edit/delete products
4. Process orders
5. View sales analytics

## Important URLs
- Homepage: `/`
- Product catalog: `/products`
- Product details: `/products/:id`
- Cart: `/cart`
- Checkout: `/checkout`
- User dashboard: `/account`
- Admin dashboard: `/admin`

## Testing Priorities
1. **Critical**: Payment flow and cart management
2. **High**: User authentication and product search
3. **Medium**: Admin operations and order tracking
4. **Low**: UI/UX improvements and analytics views

## Known Constraints
- Payment testing requires test credit card: 4242 4242 4242 4242
- Admin access requires specific test credentials
- Some features are behind feature flags (check environment variables)

## Domain-Specific Terms
- SKU: Stock Keeping Unit (product identifier)
- Inventory: Available product stock
- Fulfillment: Order processing and shipping
- Conversion: Completed purchase from visitor