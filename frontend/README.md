# Verdant & Co. — Frontend

Marketing site for the painting service platform. React 19 + Vite + TypeScript +
Tailwind CSS v4 + Framer Motion.

## Commands

```bash
npm install
npm run dev        # dev server on http://localhost:5173 (proxies /api -> http://localhost:5000)
npm run build      # typecheck + production bundle
npm run lint       # oxlint
npm test           # vitest render smoke tests (jsdom)
```

## Configuration

- `.env`: `VITE_API_BASE_URL=/api` (dev proxy defined in `vite.config.ts`)
- `src/config/site.ts`: brand name, monogram, phone, email, WhatsApp number
  (leave `whatsapp` empty to hide the floating chat button), navigation, legal copy
- `src/config/images.ts`: all image sources; hero/about/service photos are verified
  Unsplash URLs, gallery demo data is marked `isDemo`
- `src/data/content.ts`: page copy, services, property types, gallery filters

## Design system

Tokens live in `src/index.css` (`@theme`): Warm Ivory `#F7F3EB`, Forest Green
`#24483D`, Terracotta `#C87552`, plus supporting surfaces/lines/text colors and the
Fraunces (display) + Inter (body) type pairing. Utilities: `.page-container`,
`.eyebrow`, `.display-heading`. Motion respects `prefers-reduced-motion`.

## Data flow

- `src/api/client.ts` — axios instance with `/api` base URL
- Reviews, gallery items, and enquiries load from the backend; failures surface
  friendly error/empty states instead of fabricated content
- `src/store/galleryStore.ts` — gallery filters, lightbox, item limit

Run the backend (see the root `README.md`) for live data; the site remains usable
without it.
