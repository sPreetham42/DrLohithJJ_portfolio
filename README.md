# Dr. Lohith J.J. — Academic & Research Portfolio

[![Live Site](https://img.shields.io/badge/Live_Site-GitHub_Pages-047857?style=for-the-badge&logo=github)](https://spreetham42.github.io/DrLohithJJ_portfolio/)
[![License](https://img.shields.io/badge/License-MIT-0F172A?style=for-the-badge)](LICENSE)
[![Google Scholar Sync](https://img.shields.io/badge/Sync-GitHub_Actions-2563EB?style=for-the-badge&logo=githubactions)](.github/workflows/sync-scholar.yml)

A high-performance, responsive academic portfolio website for **Dr. Lohith J.J.**, Associate Professor, Department of Computer Science & Engineering, Nagarjuna College of Engineering & Technology (NCET), Bengaluru, India.

---

## 🌟 Key Features

- **Academic Aesthetics & Palette:** Built with an Emerald & Slate typography-driven design system engineered specifically for academic rigor and clarity.
- **Automated Live Metrics Sync:** Serverless daily automated cron job using Python & GitHub Actions to sync real-time citations, h-index, and paper counts from **Google Scholar** and **OpenAlex API** without consuming client/local resources.
- **Comprehensive Research Repository:** Categorized research output covering SCIE journals, Scopus-indexed papers, and IEEE International Conference proceedings with direct DOI links.
- **Invited Talks & Keynotes Showcase:** Interactive catalog highlighting 60+ FDPs, workshops, and expert lectures delivered across NITs, IITs, and premier institutions.
- **Direct Collaboration Contact:** Serverless Formspree integration forwarding research collaboration and FDP invitation inquiries straight to Gmail.
- **Pure & Lightweight:** Built using zero heavy JavaScript frameworks for instant page load times and maximum cross-device compatibility.

---

## 🛠️ Technology Stack

- **Frontend Core:** HTML5, Vanilla CSS3 (Custom Properties Design Tokens), Modern JavaScript (ES6+)
- **Typography:** *Manrope* (Sans-Serif Body) & *IBM Plex Mono* (Data Display)
- **Automation / Backend Sync:** Python 3.12, `scholarly` library, OpenAlex REST API, GitHub Actions CI/CD
- **Forms & Integration:** Formspree API
- **Deployment:** GitHub Pages

---

## 📁 Repository Structure

```
DrLohithJJ_portfolio/
├── .github/workflows/
│   └── sync-scholar.yml       # Nightly GitHub Action for metrics sync
├── assets/
│   └── Dr Lohith J J.jpeg     # High-resolution academic profile photo
├── data/
│   └── scholar.json           # Live dynamic metrics store (auto-updated)
├── scripts/
│   ├── main.js                # UI interactions, reveal animations & JSON fetch
│   └── sync_scholar.py        # Python scraper & OpenAlex API aggregator
├── styles/
│   ├── main.css               # Component styles & layout responsive grid
│   ├── reset.css              # Baseline CSS reset
│   └── variables.css          # Design system color tokens & typography scale
├── index.html                 # Main single-page application structure
└── README.md                  # Project documentation
```

---

## 🚀 Local Development

To run and preview the site locally on your computer:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sPreetham42/DrLohithJJ_portfolio.git
   cd DrLohithJJ_portfolio
   ```

2. **Serve locally:**
   You can serve the directory using any static web server, for example:
   ```bash
   npx serve .
   # OR using Python
   python -m http.server 3000
   ```
   Open `http://localhost:3000` in your browser.

---

## 🤖 Automated Daily Citation Sync

The automated workflow (`.github/workflows/sync-scholar.yml`) runs every night at **00:30 UTC (6:00 AM IST)** on GitHub's cloud servers:
1. Executes `scripts/sync_scholar.py`.
2. Queries Google Scholar & OpenAlex API for updated metrics.
3. Compares results with strict safety checks (ensures citation counts never regress).
4. Auto-commits changes to `data/scholar.json`, keeping the web app updated automatically.

---

## 📜 License & Rights

© 2026 Dr. Lohith J.J. All rights reserved.  
Source code released under the [MIT License](LICENSE).
