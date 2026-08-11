<p align="center">
  <img src="docs/kafeel-logo.svg" alt="كفيل — Kafeel logo" width="110" />
</p>

<h1 align="center">كفيل — Kafeel Admin Dashboard</h1>

<p align="center">
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-075e66?style=for-the-badge&logo=react&logoColor=white" alt="React 19" /></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-8-206e75?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 8" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind%20CSS-4-2d7f83?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" /></a>
  <a href="https://reactrouter.com/"><img src="https://img.shields.io/badge/React%20Router-7-3e8e94?style=for-the-badge&logo=reactrouter&logoColor=white" alt="React Router 7" /></a>
  <a href="https://recharts.org/"><img src="https://img.shields.io/badge/Recharts-3-5aa9a0?style=for-the-badge" alt="Recharts 3" /></a>
  <a href="https://vitest.dev/"><img src="https://img.shields.io/badge/Vitest-4-3e8e94?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest 4" /></a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript-ESM-6ab8b4?style=for-the-badge&logo=javascript&logoColor=white" alt="JavaScript (ESM)" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/RTL-%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9-75bcba?style=for-the-badge" alt="RTL — العربية" />
  <img src="https://img.shields.io/badge/UI-Arabic%20First-75bcba?style=for-the-badge" alt="Arabic-first UI" />
</p>

---

A bilingual (Arabic-first, RTL) admin dashboard for **كفيل**, a counseling and mental-health services platform. It gives the platform team a single control center to manage specialists, clients, courses, sessions, earnings, and day-to-day communication.

Built with **React 19 + Vite 8 + Tailwind CSS 4**, using **React Router 7** for navigation and **Recharts** for data visualizations. Every page is wired to the **Spring Boot API** in [`../api`](../api) — there is no mock data left in the app.

> 🇸🇦 The UI is fully in Arabic with an RTL layout (`dir="rtl"`, Cairo font).

## ✨ Features

| Module | Route | Description |
| --- | --- | --- |
| **Login** | `/login` | JWT sign-in; every other route is behind an auth guard |
| **Dashboard** | `/` | Live KPI stat cards and charts (earnings, sessions, growth) |
| **Earnings** | `/earnings` | Revenue breakdown, payouts, and earnings analytics |
| **Transactions** | `/transactions` | Payment ledger with **server-side search / status / date-range filters**, add / edit / delete, inline status changes, and CSV export |
| **Programs** | `/programs` | Program catalog with **enrollment management** (capacity checks, refunds) |
| **Courses** | `/courses` | Course catalog with **add / edit** forms, **lesson management**, and **enrollment management** (add/edit/delete lessons, enroll clients, flip payment status) |
| **Sessions** | `/sessions` | One-on-one counseling sessions management |
| **Meetings** | `/meetings` | Group meetings & video gatherings |
| **Clients** | `/clients` | Client directory and records |
| **Specialists** | `/specialists` | Specialist directory with **details**, **add**, **edit**, status and delete actions |
| **Conversations** | `/conversations` | Client chat inbox — search, unread filter, **start new conversations**, and live message sending |
| **Notifications** | `/notifications` | System notifications feed |
| **FAQ** | `/faq` | Frequently asked questions management |
| **Settings** | `/settings` | General platform settings |
| **Profile** | `/profile` | Personal account settings with a **real change-password** flow |

## 🧱 Tech Stack

- **React 19** — with lazy-loaded route pages for fast initial load
- **Vite 8** — dev server & production builds
- **Tailwind CSS 4** — utility-first styling with a custom teal brand theme (`@theme` in `src/index.css`)
- **React Router 7** — nested layouts & routing with a protected-route guard
- **Recharts** — charts on Dashboard / Earnings
- **Spring Boot API** (in [`../api`](../api)) — PostgreSQL 17, Flyway migrations, JWT auth; see the [API README](../api/README.md)
- **Vitest 4 + Testing Library** — unit and component tests
- **Oxlint** — linting

## 📁 Project Structure

```
├── index.html                 # RTL entry HTML (Cairo font)
├── vite.config.js             # Vite config + Vitest test block + /api dev proxy → :8080
├── src/
│   ├── main.jsx               # React root + BrowserRouter
│   ├── App.jsx                # Route table (public /login + guarded layout)
│   ├── index.css              # Tailwind 4 + brand theme tokens
│   ├── api.js                 # Thin fetch client: auth headers, /api/meta, all endpoints
│   ├── auth.jsx / useAuth.js  # AuthProvider, RequireAuth guard, session restore
│   ├── meta.js                # ensureMeta singleton + useMeta hook (enum labels from /api/meta)
│   ├── components/
│   │   ├── layout/            # AppLayout, Sidebar, Topbar (with logout)
│   │   └── ui/                # Reusable UI kit (Button, Card, Badge, Avatar, Input, Icon, Modal, ...)
│   ├── pages/                 # One file per route
│   ├── data/                  # UI-only vocabulary (free-form categories — NOT mock data)
│   ├── utils/                 # Formatting helpers (fmtDate, num, localDateStr)
│   └── test/                  # Vitest setup (jest-dom matchers)
└── *.test.js(x)               # Unit + component tests next to the code they cover
```

## 🚀 Getting Started

The frontend talks to the Spring Boot backend (see [`../api/README.md`](../api/README.md) for setup details). Start the backend first, then the dev server:

```bash
# 1. Start PostgreSQL (docker compose in the api/ folder)
cd ../api && docker compose up -d

# 2. Run the API (http://localhost:8080) — applies Flyway migrations + seeds an admin user
cd ../api && ./mvnw spring-boot:run

# 3. Install and start the frontend (http://localhost:5173, /api proxied to :8080)
cd ../kafeel
npm install
npm run dev
```

Sign in with the seeded admin account (see the API README for overrides):

```
admin@kafeel.sa / kafeel
```

## 📜 Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint over the source |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |

## 🧪 Testing

[Vitest 4](https://vitest.dev/) with jsdom and [Testing Library](https://testing-library.com/). Pure-logic tests cover the formatting helpers (`src/utils/format.test.js`), the `/api/meta` label helpers and pricing rules (`src/meta.test.js`), and the `ensureMeta` single-fetch cache/retry singleton (`src/meta.ensure.test.js`). Component tests render the UI kit (`Button`, `Badge`) with jest-dom matchers (`src/test/setup.js`).

## 🔐 Authentication

- `POST /api/auth/login` returns a JWT; the token lives in `localStorage` and is attached as a `Bearer` header by `src/api.js` on every request.
- `App.jsx` keeps `/login` public and wraps the whole layout in `<RequireAuth>` — unauthenticated visits redirect to login and return to the originally requested page afterwards.
- On a **401** (expired/invalid token) the client drops the token and auto-logs out; a wrong password on the login page itself shows the Arabic error instead of bouncing.
- The **Profile → الأمان** tab calls the real `POST /api/auth/change-password` endpoint (current + new password, min 8 chars).

## 🗄️ Data & API Wiring

Every page fetches from the Spring Boot API through the Vite dev proxy (`/api` → `localhost:8080`) — **no mock data remains**. Highlights:

- **Enum labels come from the API, not the frontend.** `src/meta.js` loads all Arabic enum labels once from `GET /api/meta` (`ensureMeta` singleton — single fetch, cached, retries after failure) and exposes them via `useMeta()`. Filter bars, status selects, and stat strips are built from that payload, so the UI labels can never drift from what the API accepts.
- **`src/data/` is not mock data.** It holds only free-form UI vocabulary the backend does not own as enums: course/program/specialty categories, cover colors, earnings periods, and experience/qualification ranges.
- **Specialist detail** uses `/api/specialists/{id}/detail`; **course details** embed lessons + enrollments; **programs** have real enrollment with capacity checks; **earnings** hit `/api/earnings/summary?period=…`; **transactions** use the full `/api/transactions` CRUD (list with `?search=&status=&from=&to=`, create, update, status PATCH, delete).
- **Search/filter/sort** stay client-side over the fetched rows on most pages (the API list endpoints also support `?status=&search=` where useful). **Transactions is the one server-side-filtered list** — its search box, status filter, and date range all round-trip to the API (debounced), so the results reflect the ledger on the backend.

## 🎨 Theming

The brand theme lives in `src/index.css` under the `@theme` block — teal `primary` colors, mint accents, and semantic tokens (`ink`, `surface`, `card`, `line`). All UI components read from these tokens, so restyling the whole app is a matter of editing that single block.
