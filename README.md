# Smart Inventory System

A modern inventory and order management app built with Next.js App Router and TypeScript. Optimized for quick configuration, reliable stock tracking, and easy purchase flow.

## What it does

### Authentication

- Email/password sign-up and log-in
- JWT stored in an HTTP-only cookie
- Protected routes enforced by middleware

### Product and category control

- Add, edit, delete products
- Create and remove categories
- Products can be `active` or `out_of_stock`
- Low-stock status shown with visuals

### Orders workflow

- Build multi-item orders
- Status pipeline: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`
- Inventory is decremented on order creation
- Cancels restore item stock

### Data integrity checks

- Prevent duplicate product lines in a single order
- Block ordering unavailable items
- Helpful messages:
  - `This product is already added to the order.`
  - `"<product-name>" is currently unavailable.`

### Restock pipeline

- Unsafe inventory gets queued automatically
- Priority levels: `high`, `medium`, `low`
- Manual restock and queue reset actions

### Dashboard + activity

- KPI cards for orders, pending work, low stock, and revenue
- Revenue trend chart
- Activity log with pagination

### Productivity features

- Global search and filtering for products + orders
- Pagination for large lists (products/orders/activity)

---

## Tech stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4 + shadcn-style primitives
- Formik + Zod (forms & validation)
- SWR (data fetching)
- Zustand (client state)
- jose + bcryptjs (auth)
- MongoDB (official driver)
- Recharts (charts)

---

## Quick start

### Requirements

- Node.js 20+
- npm / pnpm
- MongoDB connection (Atlas or self-hosted)

### 1. Install

```bash
cd smart-inventory-system
pnpm install
```

### 2. Environment

Create `.env`:

```env
JWT_SECRET=your-strong-secret
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=smart_inventory
DB_PATH=./data/db.json
PORT=3000
```

- `MONGODB_URI` is required.
- `DB_PATH` is seed fallback data.

### 3. Start app

```bash
pnpm dev
```

Open `http://localhost:3000`

---

## Data behavior

- Single app state record stored in MongoDB `app_state` collection (`_id: "singleton"`).
- On first startup seed data from `data/db.json` if app state is missing.
- Reseed manually by reloading `data/db.json` into Mongo.

---

## Production

```bash
npm run build
npm run start
```

---

## Deploy setup

- Set env vars: `JWT_SECRET`, `MONGODB_URI`, `MONGODB_DB_NAME`
- On Atlas: whitelist IP addresses
- Avoid unrestricted `0.0.0.0/0` in production

---

## Repository structure

```
src/
  app/
    (auth)/
    (app)/
    api/
  components/
  hooks/
  lib/
  store/
  types/

data/
  db.json
middleware.ts
```
