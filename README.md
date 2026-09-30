# SMT Grocery — Full-Stack Grocery E-Commerce

Your original SMT Grocery frontend, kept fully intact visually, now backed by
a real Node.js/Express + MongoDB API with JWT auth, a working cart/wishlist,
server-validated coupons, order management with PDF invoices, and an admin
dashboard.

```
SMT-Grocery/
├── backend/      Express + Mongoose REST API
└── frontend/     Your original Vite + TypeScript SPA, now wired to the API
```

See the chat response for the full list of what changed, what was fixed,
and a testing checklist. Quick start below.

## 1. Prerequisites

- Node.js 18+
- A MongoDB connection (local `mongod`, Docker, or MongoDB Atlas)

## 2. Backend setup

```bash
cd backend
cp .env.example .env      # then edit MONGO_URI / JWT_SECRET as needed
npm install
npm run seed               # creates categories, products, coupons, admin user
npm run dev                 # http://localhost:5000
```

Default admin login after seeding (change these in `.env` before seeding in
any real deployment):
- Email: `admin@smtgrocery.com`
- Password: `Admin@12345`

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env      # VITE_API_URL should point at the backend above
npm install
npm run dev                 # http://localhost:5173
```

Open http://localhost:5173 in your browser.

## 4. Building for production

```bash
cd frontend && npm run build   # outputs to frontend/dist
cd backend  && npm start        # serves the API (point a static host / reverse proxy at frontend/dist)
```

## Notes

- Product/category images are generated locally (no external image
  dependency), so the storefront works fully offline once seeded.
- Online payment (UPI/Card/Net Banking) is integration-ready but has no live
  gateway wired in — see `PAYMENT_KEY_ID`/`PAYMENT_KEY_SECRET` in
  `backend/.env.example` and the comments in
  `backend/controllers/paymentController.js`.
