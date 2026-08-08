# كفيل — Kafeel Admin Dashboard

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
