# Project Summary for Agents

## Overview
This is a Next.js 16 application using the App Router and TypeScript. It is an e-commerce storefront called **Circuits** focused on electronic components, with shopping, authentication, order processing, and admin product management.

## Key Technologies
- Next.js 16 (App Router)
- React 19
- TypeScript
- Mongoose + MongoDB
- next-auth for authentication
- bcryptjs for credential password hashing
- nodemailer for email notifications
- CSS Modules for styling
- Heroicons for UI icons

## Main Features Implemented
- Public homepage with featured components and category navigation
- Product catalog listing with search and category filtering
- Product detail pages with add-to-cart support
- Shopping cart with quantity controls, localStorage persistence, and checkout flow
- Authenticated user profiles with order history
- Registration and login using email/password plus Google/GitHub OAuth
- Admin panel to add new products
- Order creation endpoint that decrements stock and optionally sends notification emails
- Database seeding endpoint for sample categories and products

## Data Models
- `User`:
  - `name`, `email`, `password` (optional for OAuth), `image`, `role` (`user` or `admin`)
- `Product`:
  - `name`, `description`, `price`, `discount`, `category`, `stock`, `image`
- `Category`:
  - `name`, `description`
- `Order`:
  - `user`, `buyerDetails`, `items`, `total`, `status`

## Auth and Roles
- `next-auth` configured in `src/app/api/auth/[...nextauth]/route.ts`
- Supports:
  - Credentials login
  - Google OAuth
  - GitHub OAuth
- Admin role assignment:
  - via `ADMIN_EMAILS` environment variable for registration/OAuth
- Protected routes:
  - `/profile`, `/admin`, and checkout paths are protected by `src/proxy.ts` middleware

## Important API Routes
- `GET /api/products`:
  - Returns products
  - Supports `category` and `search` query parameters
- `POST /api/auth/register`:
  - Creates local user account with hashed password
- `GET/POST /api/orders`:
  - `GET` returns orders for current user or all orders for admin
  - `POST` places an order, validates buyer details, updates stock, and sends email if SMTP is configured
- `POST /api/admin/products`:
  - Admin-only product creation endpoint
- `GET /api/seed`:
  - Seeds demo categories and products (disabled in production unless `ENABLE_DB_SEED=true`)

## Page Structure
- `/` — Home page with categories and featured products
- `/products` — Product listing with search/filter
- `/products/[id]` — Product detail and add-to-cart
- `/cart` — Cart contents and checkout form
- `/login` — Sign-in page
- `/register` — User registration page
- `/profile` — Authenticated user profile and order history
- `/admin` — Admin dashboard for product creation

## Notable Implementation Details
- Cart is stored in `localStorage` via `src/context/CartContext.tsx`.
- The app layout wraps content with `Providers` to supply session and cart context.
- Product detail page uses server-side data fetching via Mongoose and has `revalidate = 60`.
- Middleware `src/proxy.ts` restricts admin and profile-related routes when not authorized.
- Email notifications use SMTP credentials set via `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_SERVICE`, and `EMAIL_FROM`.

## Environment Variables
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `ADMIN_EMAILS`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_SERVICE`, `EMAIL_FROM`
- `ENABLE_DB_SEED`

## Current Gaps / Notes
- The home page links to `/contact`, but there is no `src/app/contact` page in the current repository.
- Admin dashboard UI is basic and can be extended to support order management and product editing.
- The product category field on admin creation accepts either an ObjectId or category name.

## Project Status
This project is functionally complete as an MVP storefront with authentication, cart/checkout workflow, product administration, and order tracking. It appears built around a demo electronics store with seeded product data and standard e-commerce flows.
