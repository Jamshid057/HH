# MyJob — frontend

React 19 + Vite + React Router. Pixel-matched to the MyJob Figma design (1920px canvas, 1320px container, Inter).

```bash
cp .env.example .env     # VITE_API_URL=http://localhost:8000
npm ci
npm run dev              # http://localhost:3000
npm run build            # production build in dist/
```

## Structure
- `src/api.js` — fetch wrapper (JWT + automatic refresh), pagination helpers, labels
- `src/auth.jsx` — auth context (`/accounts/me/`)
- `src/figma.css` — Figma-exact styles (`f-*`, `fd-*`, `fs-*`, `fa-*` prefixes); `index.css` holds base tokens
- `src/components/figma.jsx` — header, footer, job cards, pager, dashboard shell
- `src/pages/` — Home, Auth, Jobs, Browse (employers/candidates), CandidateDash, EmployerDash, Static (blog, about, contact, FAQ, 404…)

Payments are not connected: Pricing / Checkout / Plans & Billing are UI-only and never collect card data.
