# Dr. Lohith J.J. — Academic & Research Portfolio

[![Live Site](https://img.shields.io/badge/Live_Site-drlohithjj.in-047857?style=for-the-badge&logo=googlechrome)](https://drlohithjj.in)
[![Admin Dashboard](https://img.shields.io/badge/Admin_Dashboard-drlohithjj.in%2Fdashboard-3B82F6?style=for-the-badge&logo=react)](https://drlohithjj.in/dashboard)
[![Database](https://img.shields.io/badge/Database-Cloudflare_D1-F38020?style=for-the-badge&logo=cloudflare)](https://developers.cloudflare.com/d1/)
[![Google Scholar Sync](https://img.shields.io/badge/Sync-GitHub_Actions-2563EB?style=for-the-badge&logo=githubactions)](.github/workflows/sync-scholar.yml)
[![License](https://img.shields.io/badge/License-MIT-0F172A?style=for-the-badge)](LICENSE)

A high-performance, dynamic academic portfolio and serverless research repository for **Dr. Lohith J.J.**, Professor & Head of Department — Computer Science & Engineering (IoT & Cybersecurity including Blockchain Technology) at Nagarjuna College of Engineering & Technology (NCET), Bengaluru, India.

---

## 🌟 Architecture & Key Features

- **Source of Truth:** **Cloudflare D1** (Serverless relational SQLite on the edge) with full referential integrity and versioned audit history.
- **Admin CMS Dashboard:** Dedicated React 19 Single Page Application hosted at `/dashboard/` with GitHub OAuth and encrypted D1 session authentication.
- **Public Delivery:** Cloudflare Worker Static Assets (`dist-site/`) serving the public portfolio from the edge with ultra-low latency.
- **Automated Live Metrics Sync:** Nightly GitHub Actions workflow utilizing Python to retrieve citations, h-index, and paper counts from **Google Scholar** and **OpenAlex API**, persisting updates directly to Cloudflare D1.
- **Academic & Technology Design System:** Emerald & Graphite typography-driven design system engineered for academic rigor, readability, and mobile responsiveness.
- **Interactive Research Explorer:** Filterable scholarly catalog across blockchain security, smart contracts, IoT, and AI.
- **Sanity CMS:** **DECOMMISSIONED / REMOVED** (Archived permanently in `data/archive/`).

---

## 🛠️ Technology Stack

- **Public Frontend:** HTML5, Vanilla CSS3, Modern ES Modules, Dynamic D1 Public API Adapter
- **Admin Dashboard:** React 19, TypeScript, Vite, Tailwind-free custom CSS design system
- **Backend / Edge Compute:** Cloudflare Workers (TypeScript), D1 SQLite Database, Edge Cache API
- **Authentication:** GitHub OAuth 2.0 with D1 Session Management (`__Host-admin_session` Secure HttpOnly cookies) & CSRF defense
- **Automation / Metrics Sync:** Python 3.12, `scholarly`, OpenAlex REST API, Cloudflare Worker Automation Endpoint
- **Object Storage:** Cloudflare R2 (Architecture prepared, deferred)
- **Domain & Edge Routing:** Cloudflare DNS & Unified Routing ([drlohithjj.in](https://drlohithjj.in))

---

## 📁 Repository Structure

```
DrLohithJJ_portfolio/
├── .github/workflows/
│   └── sync-scholar.yml       # Nightly GitHub Action for Scholar & D1 sync
├── admin/                     # React 19 Admin SPA (/dashboard)
│   ├── src/                   # Admin components, pages, hooks, and API client
│   └── vite.config.ts         # Vite bundler config with base /dashboard/
├── assets/                    # Headshot images and static assets
├── data/
│   ├── archive/               # Permanent historical backups (Sanity & D1 snapshots)
│   ├── scholar.json           # Derived static fallback metrics
│   └── scholar_sync_status.json # Pipeline health status artifact
├── db/migrations/             # Versioned SQL migrations for Cloudflare D1
├── scripts/
│   ├── build_unified_site.js  # Unified build script for Cloudflare static assets
│   ├── data/                  # Public API adapter and static fallback repository
│   ├── main.js                # Public portfolio entrypoint
│   ├── research-explorer.js   # Interactive domain filter & research cards
│   ├── scholar-health.js      # Scholar sync diagnostics modal
│   ├── sync_scholar.py        # Python automated metrics scraper
│   └── talks.js               # Talks controller
├── styles/                    # Design system styles
├── worker/                    # Cloudflare Worker API backend
│   ├── handlers/              # Public, Admin, Auth, and Automation handlers
│   ├── repositories/          # D1 query and mutation data access layer
│   ├── middleware/            # Session authentication and CSRF protection
│   └── index.ts               # Worker entrypoint and unified router
├── index.html                 # Public portfolio homepage
├── wrangler.toml              # Cloudflare Worker & D1 binding configuration
└── README.md                  # Project documentation
```

---

## 📜 License & Rights

© 2026 Dr. Lohith J.J. All rights reserved.  
Source code released under the [MIT License](LICENSE).
