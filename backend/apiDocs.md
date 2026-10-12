# Maryland Pharmacy API Reference

All routes are mounted by `src/server.js` under `/api`. The local base URL is `http://localhost:5000/api`; in production, use the deployed backend URL followed by `/api`.

Requests with JSON bodies should send `Content-Type: application/json`. Protected routes require `Authorization: Bearer <token>`.

## Authentication

- **Client token:** returned by the client signup/login routes; verified with `JWT_SECRET`.
- **Admin token:** returned by the admin login route; verified with `ADMIN_JWT_SECRET`. A client token cannot be used on admin-protected routes.
- Routes marked **Public** do not require a token.

## Authentication Routes (`/auth`)

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/signup` | Public | Register a client account. |
| `POST` | `/auth/login` | Public | Authenticate a client and return a token. |
| `POST` | `/auth/forget-password` | Public | Send a password-reset email. |
| `PUT` | `/auth/reset-password/:resettoken` | Public | Set a new password using the emailed token. |

### `POST /auth/signup`

Body fields: `name`, `email`, `password`; optional `phone`, `gender`, `street`, `aptNumber`, `city` (city defaults to Alexandria).

### `POST /auth/login`

Body: `{ "email": "person@example.com", "password": "..." }`

### `POST /auth/forget-password`

Body: `{ "email": "person@example.com" }`

### `PUT /auth/reset-password/:resettoken`

Body: `{ "password": "new-password" }`. Reset tokens expire after 10 minutes.

## Admin Routes (`/admin`)

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/admin/login` | Public | Authenticate the admin using the configured admin credentials. |
| `GET` | `/admin/stats` | Admin | Return order/inquiry dashboard totals. |

### `POST /admin/login`

Body: `{ "email": "admin@example.com", "password": "..." }`

### `GET /admin/stats`

Returns counts for `totalOrders`, `monthlyOrders`, `yearlyOrders`, `pendingInquiries`, and `deliveredOrders`, plus legacy `totalSales`, `monthlySales`, and `yearlySales` aliases.

## Product Routes (`/products`)

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/products` | Public | List products with pagination, filtering, search, and sorting. |
| `GET` | `/products/:id` | Public | Get one product by ID. |
| `POST` | `/products` | Admin | Create a product. |
| `PUT` | `/products/:id` | Admin | Update a product. |
| `DELETE` | `/products/:id` | Admin | Delete a product. |

### `GET /products` query parameters

All parameters are optional.

| Parameter | Description |
| --- | --- |
| `page` | Page number; defaults to `1` and is clamped to a minimum of `1`. |
| `limit` | Results per page; defaults to `12`, minimum `1`, maximum `100`. |
| `category` | Exact category match, case-insensitive. Hyphens are converted to spaces. `maryland-products` selects Maryland products; empty or `all` disables category filtering. |
| `search` | Case-insensitive search in title, category, and description. |
| `lowStock` | Set to `true` to return products with stock below `10`. |
| `sort` | `latest`, `featured`, or `name`; unrecognized/missing values use featured ordering. |

Example: `GET /products?category=personal-care&page=1&limit=24&sort=latest`

Response shape: `{ "products": [], "page": 1, "pages": 0, "total": 0, "hasMore": false }`.

### Product write bodies

`POST /products` accepts `title` (or `name`), `description`, `category`, `image`, and optionally `stock` and `isMaryland`. Category is stored uppercase with hyphens converted to spaces; omitted stock defaults to `0` and omitted `isMaryland` defaults to `false`.

`PUT /products/:id` accepts any of `title`, `price`, `description`, `category`, `image`, `stock`, and `isMaryland` to update. Note: `price` is accepted by the controller but is not declared in the current Product schema.

## Order Routes (`/orders`)

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/orders` | Client | Create a signed-in user's order/inquiry. |
| `GET` | `/orders` | Admin | List all orders. |
| `DELETE` | `/orders` | Admin | Delete all orders. |
| `GET` | `/orders/myorders` | Client | List the signed-in user's orders. |
| `GET` | `/orders/:id` | Client | Get one order by ID. |
| `DELETE` | `/orders/:id` | Admin | Delete one order. |
| `PUT` | `/orders/:id/status` | Admin | Update an order's status. |

### `POST /orders`

Body fields: `orderItems` (non-empty array of `{ "product": "<productId>", "quantity": 1 }`), optional `shippingAddress` (`street`, `city`, `phone`), and optional `notes`. The server verifies each product and creates the order with status `Inquiry Received`. Missing address fields use server defaults.

### `PUT /orders/:id/status`

Body: `{ "status": "Confirmed via WhatsApp" }`. Allowed model statuses are `Inquiry Received`, `Confirmed via WhatsApp`, `Out for Delivery`, `Delivered`, and `Cancelled`.

## Settings Routes (`/settings`)

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/settings` | Public | Read settings (creates defaults if none exist). |
| `PUT` | `/settings` | Admin | Update delivery fee and notification email recipients. |

### `PUT /settings`

Body fields: `deliveryFee` and optional `notificationEmails` (array; at most three addresses are saved).

## User Routes (`/users`)

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/users/register` | Public | Register a client account. |
| `POST` | `/users/login` | Public | Authenticate a client and return a token. |
| `GET` | `/users/profile` | Client | Get the signed-in user's profile. |
| `PUT` | `/users/profile` | Client | Update profile, addresses, and optionally password. |
| `POST` | `/users/address` | Client | Add an address. |
| `PUT` | `/users/address/:id` | Client | Update an address. |
| `DELETE` | `/users/address/:id` | Client | Delete an address. |

### `POST /users/register`

Body fields: `name`, `email`, `password`; optional `phone`, `street`, `aptNumber`, `city` (city defaults to Alexandria). Returns a client token.

### `POST /users/login`

Body: `{ "email": "person@example.com", "password": "..." }`

### `PUT /users/profile`

Accepts optional `name`, `email`, `phone`, `addresses`, and `password`. To change the password, also provide `oldPassword`. The response includes the updated profile and a refreshed client token.

### Address bodies

`POST /users/address` accepts an address object such as `{ "street": "10 Main St", "city": "Alexandria", "aptNumber": "2A", "phone": "01000000000", "isDefault": true }`.

`PUT /users/address/:id` updates `street`, `city`, and/or `phone`.

## Controller Functions Not Registered as Routes

`userController.js` also defines `forgotPassword` and `resetPassword`, but `userRoutes.js` does not register them. Therefore `/users/forgotpassword` and `/users/resetpassword/:resettoken` are **not available**. Use the registered `/auth/forget-password` and `/auth/reset-password/:resettoken` endpoints instead.
