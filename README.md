# Dr. Lohith J.J. — Academic & Research Portfolio

[![Live Site](https://img.shields.io/badge/Live_Site-drlohithjj.in-047857?style=for-the-badge&logo=googlechrome)](https://drlohithjj.in)
[![CMS](https://img.shields.io/badge/Sanity_CMS-Studio_v3-F05340?style=for-the-badge&logo=sanity)](studio/)
[![Google Scholar Sync](https://img.shields.io/badge/Sync-GitHub_Actions-2563EB?style=for-the-badge&logo=githubactions)](.github/workflows/sync-scholar.yml)
[![License](https://img.shields.io/badge/License-MIT-0F172A?style=for-the-badge)](LICENSE)

A high-performance, dynamic academic portfolio and CMS-driven research repository for **Dr. Lohith J.J.**, Professor & Head of Department — Computer Science & Engineering (IoT & Cybersecurity including Blockchain Technology) at Nagarjuna College of Engineering & Technology (NCET), Bengaluru, India.

---

## 🌟 Key Features

- **Dynamic Headless CMS Integration:** Powered by **Sanity Studio v3**, allowing non-technical content updates for publications, awards, invited talks, employment timeline, education, skills, and profile bio without editing source code.
- **Single-Click Document & Asset Management:** Direct file asset uploads for publication PDFs, award certificates, and high-resolution profile imagery managed seamlessly via Sanity CDN.
- **Automated Live Metrics & Sanity Sync:** Serverless daily automated cron job using Python & GitHub Actions to scrape real-time citations, h-index, and paper counts from **Google Scholar** and **OpenAlex API**, mutating Sanity dataset records in real-time.
- **Academic & Technology Design System:** Built with an Emerald & Graphite typography-driven design system engineered specifically for academic rigor, readability, and visual excellence.
- **Interactive Knowledge Dissemination:** Filterable catalog featuring 28+ invited talks, FDPs, and keynotes delivered across NITs, IITs, and premier institutions, formatted with balanced grid layouts.
- **Direct Collaboration Contact:** Serverless Formspree integration forwarding research collaboration and FDP invitation inquiries straight to Gmail via asynchronous AJAX handling.
- **Pure & Lightweight Architecture:** Built using Vanilla HTML5, CSS3, and ES Modules without heavy JavaScript frameworks for instant page load times and 100% cross-device responsiveness.

---

## 🛠️ Technology Stack

- **Frontend Core:** HTML5, Vanilla CSS3 (Custom Properties & Tokens), Modern JavaScript (ES Modules)
- **CMS Backend:** Headless **Sanity Studio v3**, GROQ Query Engine, Read-Only Public CDN API (`apicdn.sanity.io`)
- **Typography:** *Manrope* (Clean Body & UI) & *IBM Plex Mono* (Data Display)
- **Automation / Metrics Sync:** Python 3.12, `scholarly` library, OpenAlex REST API, Sanity Mutation API, GitHub Actions CI/CD
- **Forms & Integration:** Formspree AJAX API
- **Deployment & Hosting:** GitHub Pages on Custom Domain ([drlohithjj.in](https://drlohithjj.in))

---

## 📁 Repository Structure

```
DrLohithJJ_portfolio/
├── .github/workflows/
│   └── sync-scholar.yml       # Nightly GitHub Action for Scholar & Sanity sync
├── assets/
│   └── Dr Lohith J J.jpeg     # High-resolution academic profile photo
├── data/
│   ├── initial_sanity_data.ndjson # NDJSON seed dataset (65 documents)
│   └── scholar.json           # Fallback metrics store
├── scripts/
│   ├── main.js                # ES Module main UI controller & event listeners
│   ├── sync_scholar.py        # Python scraper & Sanity mutation aggregator
│   └── sanity/
│       ├── client.js          # Tokenless read-only Sanity CDN client
│       ├── queries.js         # Centralized GROQ query definitions
│       └── loader.js          # Asynchronous DOM card renderer & animation observer
├── studio/                    # Headless Sanity Studio v3 Admin Dashboard
│   ├── sanity.config.js       # Sanity Studio configuration
│   ├── sanity.cli.js          # Sanity CLI settings
│   ├── package.json           # Studio dependencies
│   └── schemas/               # 14 Content schemas (profile, publication, award, etc.)
├── styles/
│   ├── main.css               # Design system component styles & responsive grid
│   ├── reset.css              # Baseline CSS reset
│   └── variables.css          # Color tokens & typography scale
├── index.html                 # Main single-page application structure
├── ADMIN_GUIDE.md             # Non-technical admin guide for Dr. Lohith
├── CNAME                      # Custom domain configuration (drlohithjj.in)
└── README.md                  # Project documentation
```

## 🤖 Automated Daily Citation Sync

The automated workflow (`.github/workflows/sync-scholar.yml`) runs every night at **00:30 UTC (6:00 AM IST)** on GitHub Actions cloud servers:
1. Executes `scripts/sync_scholar.py`.
2. Queries Google Scholar & OpenAlex API for updated metrics.
3. Applies safety checks to ensure citation counts never regress.
4. Mutates the `scholarStats` document inside Sanity CMS using secure `SANITY_WRITE_TOKEN`.
5. Updates local `data/scholar.json` fallback store, keeping the portfolio updated automatically.

---

## 📜 License & Rights

© 2026 Dr. Lohith J.J. All rights reserved.  
Source code released under the [MIT License](LICENSE).
