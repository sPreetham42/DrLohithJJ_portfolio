# Dr. Lohith J.J. — Academic & Research Portfolio

[![Live Site](https://img.shields.io/badge/Live_Site-drlohithjj.in-047857?style=for-the-badge&logo=googlechrome)](https://drlohithjj.in)
[![Admin Dashboard](https://img.shields.io/badge/Admin_Dashboard-drlohithjj.in%2Fdashboard-3B82F6?style=for-the-badge&logo=react)](https://drlohithjj.in/dashboard)
[![Database](https://img.shields.io/badge/Database-Cloudflare_D1-F38020?style=for-the-badge&logo=cloudflare)](https://developers.cloudflare.com/d1/)
[![CI Verification](https://img.shields.io/badge/CI-GitHub_Actions-2563EB?style=for-the-badge&logo=githubactions)](.github/workflows/ci.yml)
[![Google Scholar Sync](https://img.shields.io/badge/Sync-GitHub_Actions-2563EB?style=for-the-badge&logo=githubactions)](.github/workflows/sync-scholar.yml)
[![License](https://img.shields.io/badge/License-MIT-0F172A?style=for-the-badge)](LICENSE)

An academic portfolio and serverless research platform for **Dr. Lohith J.J.**, Professor & Head of Department — Computer Science & Engineering (IoT & Cybersecurity including Blockchain Technology) at Nagarjuna College of Engineering & Technology (NCET), Bengaluru, India.

---

## 🌟 Architecture & Key Features

- **Relational Source of Truth:** **Cloudflare D1** (Serverless relational SQLite on the edge) with strict foreign keys, optimistic concurrency versioning, and immutable revision audit logging.
- **Static-First Public Delivery:** Public portfolio served via Cloudflare Worker Static Assets (`dist-site/`) with client-side API hydration and zero-dependency offline fallback.
- **Admin CMS Dashboard:** Dedicated React 19 Single Page Application hosted at `/dashboard/` with GitHub OAuth 2.0 and encrypted D1 session management (`__Host-admin_session` Secure HttpOnly cookies with CSRF defense).
- **Edge Cache Architecture:** TTL-based edge caching (`s-maxage=120, stale-while-revalidate=300`) with explicit cache tagging.
- **Automated Live Metrics Sync:** Daily scheduled GitHub Actions workflow utilizing Python to retrieve citations, h-index, and paper counts from **Google Scholar** with automated **OpenAlex REST API** fallback, persisting updates directly to Cloudflare D1 via bearer-authenticated automation endpoints.
- **Academic Typography & Design System:** Emerald & Graphite typography-driven design system engineered for academic rigor, readability, and responsive multi-device presentation.
- **Interactive Research Explorer:** Filterable scholarly catalog across blockchain security, smart contracts, IoT, and AI.
- **Object Storage:** Cloudflare R2 upload architecture is staged/deferred; asset serving is handled directly via static bundle assets.

---

## 🛠️ Technology Stack

- **Public Frontend:** HTML5, Vanilla CSS3, Modern ES Modules, Dynamic D1 Public API Adapter, Local Fallback
- **Admin Dashboard:** React 19, TypeScript, Vite, Tailwind-free custom CSS design system
- **Backend / Edge Compute:** Cloudflare Workers (TypeScript), D1 SQLite Database, Worker Cache API
- **Authentication:** GitHub OAuth 2.0 with D1 Session Management (`__Host-admin_session` Secure HttpOnly cookies) & CSRF defense
- **Automation / Metrics Sync:** Python 3.12, `scholarly`, OpenAlex REST API, Cloudflare Worker Automation Endpoint
- **Object Storage:** Cloudflare R2 (Architecture prepared, deferred)
- **CI / Verification:** GitHub Actions automated CI testing type safety (`tsc --noEmit`), 61 Vitest unit & integration tests, canonical fallback integrity, physical database restore drill, and unified build packaging.

---

## 📁 Repository Structure

```
DrLohithJJ_portfolio/
├── .github/workflows/
│   ├── ci.yml                 # Automated CI: types, tests, restore drill, build
│   └── sync-scholar.yml       # Nightly GitHub Action for Scholar & D1 sync
├── admin/                     # React 19 Admin SPA (/dashboard)
│   ├── src/                   # Admin components, pages, hooks, and API client
│   └── vite.config.ts         # Vite bundler config with base /dashboard/
├── assets/                    # Headshot images and static SVG/raster assets
├── data/
│   ├── archive/               # Permanent historical backups (Sanity & D1 snapshots)
│   ├── scholar.json           # Derived static fallback metrics
│   └── scholar_sync_status.json # Pipeline health status artifact
├── db/migrations/             # Versioned SQL migrations for Cloudflare D1 (0001-0005)
├── scripts/
│   ├── build_unified_site.js  # Unified build script packaging dist-site/
│   ├── drill_database_restore.js # Physical local database restore drill
│   ├── verify_fallback_sync.js# Canonical fallback synchronization verification
│   ├── data/                  # Public API adapter and static fallback repository
│   ├── main.js                # Public portfolio entrypoint
│   ├── research-explorer.js   # Interactive domain filter & research cards
│   ├── scholar-health.js      # Scholar sync diagnostics modal
│   └── sync_scholar.py        # Python automated metrics scraper
├── styles/                    # Design system styles
├── tests/                     # Vitest test suite (61 unit & integration tests)
│   ├── helpers/               # In-memory D1 SQLite test harness (better-sqlite3)
│   ├── integration/           # Real Worker + D1 public, admin, concurrency, and rollback tests
│   └── ...                    # Auth, CSRF, CORS, and Scholar tests
├── worker/                    # Cloudflare Worker API backend
│   ├── handlers/              # Public, Admin, Auth, and Automation handlers
│   ├── repositories/          # D1 query and mutation data access layer
│   ├── middleware/            # Session authentication, CSRF, and cache headers
│   └── index.ts               # Worker entrypoint and unified router
├── index.html                 # Public portfolio homepage
├── wrangler.toml              # Cloudflare Worker & D1 binding configuration
└── README.md                  # Project documentation
```

---

## 📜 License & Rights

© 2026 Dr. Lohith J.J. All rights reserved.  
Source code released under the [MIT License](LICENSE).
