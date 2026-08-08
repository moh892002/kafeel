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
  <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript-ESM-6ab8b4?style=for-the-badge&logo=javascript&logoColor=white" alt="JavaScript (ESM)" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/RTL-%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9-75bcba?style=for-the-badge" alt="RTL — العربية" />
  <img src="https://img.shields.io/badge/UI-Arabic%20First-75bcba?style=for-the-badge" alt="Arabic-first UI" />
</p>

---

A bilingual (Arabic-first, RTL) admin dashboard for **كفيل**, a counseling and mental-health services platform. It gives the platform team a single control center to manage specialists, clients, courses, sessions, earnings, and day-to-day communication.

Built with **React 19 + Vite 8 + Tailwind CSS 4**, using **React Router 7** for navigation and **Recharts** for data visualizations.

> 🇸🇦 The UI is fully in Arabic with an RTL layout (`dir="rtl"`, Cairo font).

## ✨ Features

| Module | Route | Description |
| --- | --- | --- |
| **Dashboard** | `/` | Overview with KPI stat cards and charts (earnings, sessions, growth) |
| **Earnings** | `/earnings` | Revenue breakdown, payouts, and earnings analytics |
| **Programs** | `/programs` | Counseling & training programs catalog |
| **Courses** | `/courses` | Course catalog with **add / edit** forms (`/courses/add`, `/courses/:id/edit`) and **details** view (`/courses/:id`) |
| **Sessions** | `/sessions` | One-on-one counseling sessions management |
| **Meetings** | `/meetings` | Group meetings & video gatherings |
| **Clients** | `/clients` | Client directory and records |
| **Specialists** | `/specialists` | Specialist directory with **details** (`/specialists/:id`) and **add** (`/specialists/add`) |
| **Conversations** | `/conversations` | Client chat inbox — search, unread filter, and live message sending |
| **Notifications** | `/notifications` | System notifications feed |
| **FAQ** | `/faq` | Frequently asked questions management |
| **Settings** | `/settings` | General platform settings |
| **Profile** | `/profile` | Personal account settings |

## 🧱 Tech Stack

- **React 19** — with lazy-loaded route pages for fast initial load
- **Vite 8** — dev server & production builds
- **Tailwind CSS 4** — utility-first styling with a custom teal brand theme (`@theme` in `src/index.css`)
- **React Router 7** — nested layouts & routing
- **Recharts** — charts on Dashboard / Earnings
- **Oxlint** — linting

## 📁 Project Structure

```
├── index.html                 # RTL entry HTML (Cairo font)
├── src/
│   ├── main.jsx               # React root + BrowserRouter
│   ├── App.jsx                # Route table (lazy pages)
│   ├── index.css              # Tailwind 4 + brand theme tokens
│   ├── components/
│   │   ├── layout/            # AppLayout, Sidebar, Topbar
│   │   └── ui/                # Reusable UI kit (Button, Card, Badge, Avatar, Input, Icon, Modal, ...)
│   ├── pages/                 # One file per route
│   └── data/                  # Deterministic, seeded mock data modules
└── vite.config.js
```

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (http://localhost:5173)
npm run dev

# 3. Production build (outputs to dist/)
npm run build

# 4. Preview the production build
npm run preview
```

## 📜 Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint over the source |

## 🗃️ Data Layer

All data is **mock and client-side** — there is no backend yet. Modules in `src/data/` generate realistic, **deterministic** fixtures (seeded PRNG, e.g. `mulberry32`) so the UI stays stable between reloads and every page renders consistent demo content. Swap these modules with API calls when a backend is ready.

## 🎨 Theming

The brand theme lives in `src/index.css` under the `@theme` block — teal `primary` colors, mint accents, and semantic tokens (`ink`, `surface`, `card`, `line`). All UI components read from these tokens, so restyling the whole app is a matter of editing that single block.
