# Verdant & Co. — Painting Service Platform

A premium marketing website for a residential & commercial painting company, with a
production-ready API. Built as two independent apps:

| App | Stack | Default URL |
| --- | --- | --- |
| `frontend/` | React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, React Router 7, Zustand, Axios, React Hook Form + Zod | http://localhost:5173 |
| `backend/` | Node.js, Express 5, TypeScript, MongoDB (Mongoose), JWT auth, Zod validation, Helmet, rate limiting | http://localhost:5000/api |

## Features

**Frontend**

- Pages: Home, About, Services, Work (gallery), Reviews, Contact, Privacy, Terms, 404
- Brand system on the mandatory palette: Warm Ivory `#F7F3EB`, Forest Green `#24483D`,
  Terracotta `#C87552` (tokens in `frontend/src/index.css`)
- Framer Motion motion design with a global `prefers-reduced-motion` opt-out
- Before/after slider, lightbox gallery with category filters, review submission modal,
  sticky WhatsApp button (hidden until a real number is configured)
- Accessibility: skip-to-content link, focus-visible rings, labelled controls,
  keyboard-operable lightbox
- Resilient data handling: reviews/gallery/enquiry features degrade to clear
  empty/error states when the API is unreachable; gallery falls back to bundled
  demo photography flagged as such (nothing fabricated: no invented stats, reviews,
  or testimonials anywhere)

**Backend**

- `POST/GET /api/reviews` — public review listing (approved only) & submissions (moderated)
- `GET /api/reviews/all`, `PATCH/DELETE /api/reviews/:id` — admin moderation (JWT + role)
- `GET /api/gallery` — public published items (category filter, pagination)
- `GET/POST/PATCH/DELETE /api/gallery...` — admin CRUD
- `POST /api/enquiries`, `GET /api/enquiries` — contact form intake + admin listing
- `POST /api/auth/login`, `GET /api/auth/me` — JWT sessions, bcrypt password hashes
- `GET /api/health` — uptime check
- Security: Helmet, CORS allow-list, per-IP rate limits, Zod-validated bodies/queries

## Prerequisites

- Node.js 22 (any current LTS works)
- MongoDB running locally (e.g. `mongodb://127.0.0.1:27017`) or an Atlas URI

## Getting started

```powershell
# 1. Backend
cd backend
npm install
Copy-Item .env.example .env   # then edit values (see below)
npm run seed:admin            # creates the admin account from .env
npm run dev                   # API on http://localhost:5000/api

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                   # site on http://localhost:5173 (proxies /api -> :5000)
```

### `backend/.env`

| Key | Notes |
| --- | --- |
| `PORT` | `5000` |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/painting_platform` |
| `JWT_SECRET` | random string, min 16 chars |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `CORS_ORIGIN` | `http://localhost:5173` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | used by `npm run seed:admin` |

### `frontend/.env`

| Key | Notes |
| --- | --- |
| `VITE_API_BASE_URL` | `/api` (default; relies on the Vite dev proxy) |

## Scripts

| Where | Command | Purpose |
| --- | --- | --- |
| backend | `npm run dev` | API with reload (`tsx watch`) |
| backend | `npm run build` / `npm start` | Compile to `dist/` / run it |
| backend | `npm run typecheck` | `tsc --noEmit` |
| backend | `npm run seed:admin` | Create/update the admin account |
| frontend | `npm run dev` | Vite dev server |
| frontend | `npm run build` | Typecheck + production build |
| frontend | `npm run lint` | oxlint |
| frontend | `npm test` | Vitest render smoke tests (jsdom) |

## Project structure

```
Painting_Platform/
├── frontend/
│   ├── src/
│   │   ├── api/          # axios client + typed API modules
│   │   ├── components/   # ui/, layout/, gallery/, reviews/
│   │   ├── config/       # site.ts (brand, contacts), images.ts (CDN sources)
│   │   ├── data/         # copywriting & service/property options
│   │   ├── sections/     # page sections (hero, services, gallery, ...)
│   │   ├── pages/        # route components
│   │   ├── store/        # zustand (gallery filters/lightbox)
│   │   └── index.css     # Tailwind v4 theme tokens
│   └── vitest.config.ts
└── backend/
    └── src/
        ├── config/       # env validation, db connection
        ├── controllers/  # auth, reviews, gallery, enquiries
        ├── middleware/   # auth (JWT + roles), validation, errors
        ├── models/       # User, Review, GalleryItem, Enquiry
        ├── routes/       # /api/* routers (+ health)
        ├── validation/   # shared Zod schemas
        └── seed/         # admin seeding, test-data cleanup
```

## Content & imagery policy

- Company name, contact details (`+1 (555) 000-0000`, `hello@verdantandco.example`) are
  placeholders — edit `frontend/src/config/site.ts`.
- No fake statistics, testimonials, or awards. Reviews come only from the database and
  are shown once approved by an admin.
- Gallery shows CMS-managed images; until real photos are uploaded it displays bundled
  sample photography with an on-page note.
- Photography is served from Unsplash; replace with owned client photography for launch.
