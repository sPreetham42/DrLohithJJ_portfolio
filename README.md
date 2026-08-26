# Dr. Lohith J.J. — Academic & Research Portfolio

[![Live Site](https://img.shields.io/badge/Live_Site-drlohithjj.in-047857?style=for-the-badge\&logo=googlechrome)](https://drlohithjj.in)
[![Admin Dashboard](https://img.shields.io/badge/Admin_Dashboard-drlohithjj.in%2Fdashboard-2563EB?style=for-the-badge\&logo=react)](https://drlohithjj.in/dashboard)
[![Cloudflare D1](https://img.shields.io/badge/Database-Cloudflare_D1-F38020?style=for-the-badge\&logo=cloudflare)](https://developers.cloudflare.com/d1/)
[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=for-the-badge\&logo=githubactions)](.github/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-0F172A?style=for-the-badge)](LICENSE)

Academic and research portfolio platform for **Dr. Lohith J.J.**, Professor & Head of Department, Computer Science & Engineering (IoT & Cybersecurity including Blockchain Technology), Nagarjuna College of Engineering & Technology, Bengaluru.

The platform uses a custom React administration interface, Cloudflare Workers, Cloudflare D1, GitHub OAuth, structured academic data, automated research-metrics synchronization, revision tracking, and static fallback delivery.

## Architecture

The application is divided into four primary layers:

```text
Public Site
    │
    ▼
Cloudflare Worker
    │
    ├── Public REST API
    ├── Admin REST API
    ├── GitHub OAuth
    ├── Session Management
    ├── Automation Endpoints
    └── Edge Cache
    │
    ▼
Cloudflare D1
    │
    ├── Academic Content
    ├── Admin Sessions
    ├── Revisions
    └── Automation State


React Admin
    │
    └── /dashboard/


GitHub Actions
    │
    └── Google Scholar → OpenAlex → Worker → D1
```

The public site is static-first. HTML and static assets are served from the Worker, while academic data is hydrated through the public API. A local canonical fallback dataset is used when the API is unavailable.

## Key Engineering Features

### Structured academic data

Academic content is stored as relational data in Cloudflare D1 rather than being maintained directly inside the public HTML.

The data model covers:

* Profile
* Publications
* Talks
* Research scholars
* Experience
* Education
* Awards
* Skills
* Social links
* Research metrics

Database migrations provide versioned schema evolution with foreign-key enforcement and transactional mutations.

### Custom administration interface

The `/dashboard/` application is a purpose-built React 19 and TypeScript administration interface.

It provides structured editing for the academic content exposed by the public portfolio without requiring changes to source HTML or a third-party CMS.

### Optimistic concurrency control

Mutable records use version checks to prevent stale administrative updates from silently overwriting newer changes.

```text
Client A reads version 7
Client B reads version 7

Client A updates → version 8

Client B updates version 7
        ↓
    HTTP 409
```

This allows concurrent editing without relying on long-lived database locks.

### Revision history

Content mutations maintain immutable revision records in D1.

The current record represents the active state while revision records preserve previous states for auditability and recovery.

### GitHub OAuth authentication

The administration interface uses GitHub OAuth 2.0.

Authentication and session handling include:

* OAuth state validation
* CSRF protection
* Secure `__Host-admin_session` cookies
* HttpOnly session cookies
* Secure cookie attributes
* SHA-256 session-token hashing
* Server-side authorization middleware
* Protected state-changing API operations

### Automated research-metrics synchronization

A scheduled GitHub Actions workflow retrieves research metrics and updates the production database.

The synchronization pipeline is:

```text
Google Scholar
      │
      ├── Successful retrieval
      │
      └── Failure
             │
             ▼
          OpenAlex
             │
             ▼
       Worker automation API
             │
             ▼
          Cloudflare D1
```

The workflow is designed to provide an automated source with an API-based fallback rather than requiring research metrics to be manually updated in the portfolio.

### Static fallback and data integrity

The public application maintains a canonical fallback dataset alongside the dynamic D1-backed API.

The fallback is used when dynamic data cannot be retrieved.

Repository verification also checks synchronization between:

* `current-portfolio-snapshot.json`
* Public fallback data
* D1 restore fixtures
* Test data

This prevents the static and database representations of the academic profile from drifting independently.

### Edge caching

Public API responses use Cloudflare edge caching with controlled freshness:

```text
s-maxage=120
stale-while-revalidate=300
```

This reduces repeated database reads while allowing updated academic content to propagate without requiring a public-site rebuild.

## Public Application

The public portfolio is intentionally framework-light:

* HTML5
* CSS3
* ES Modules
* REST API integration
* Static fallback data

The public interface focuses on academic information rather than application-style UI patterns.

Research content includes publications, research domains, scholars, talks, experience, education, awards, and research metrics.

## Administration

The administration application uses:

* React 19
* TypeScript
* Vite
* Custom CSS
* REST APIs exposed by the Worker

The dashboard is deployed under:

`/dashboard/`

Authentication is handled independently from public content delivery.

## Testing

The repository contains unit and integration tests covering the Worker, D1 access layer, authentication, API behavior, concurrency handling, rollback behavior, Scholar synchronization, fallback integrity, and database restoration.

Current test coverage includes **61 tests**.

The test environment includes a local SQLite-backed D1-compatible harness using `better-sqlite3`.

The CI pipeline performs:

```text
TypeScript type checking
        ↓
Vitest test suite
        ↓
Database restore verification
        ↓
Fallback integrity verification
        ↓
Production build
```

## Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript ES Modules
* React 19
* TypeScript
* Vite

### Backend

* Cloudflare Workers
* Cloudflare D1
* Worker Cache API
* REST APIs

### Authentication

* GitHub OAuth 2.0
* Secure HttpOnly sessions
* CSRF protection

### Automation

* GitHub Actions
* Python 3.12
* Google Scholar
* OpenAlex REST API

### Testing

* Vitest
* better-sqlite3
* TypeScript

### Deployment

* Cloudflare Workers
* Cloudflare Static Assets
* GitHub Actions

Cloudflare R2 integration is prepared at the architecture level but is not currently part of the production asset pipeline.

## Repository Structure

```text
DrLohithJJ_portfolio/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── sync-scholar.yml
│
├── admin/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── api/
│
├── assets/
│
├── data/
│   ├── scholar.json
│   └── scholar_sync_status.json
│
├── db/
│   └── migrations/
│
├── scripts/
│   ├── data/
│   ├── build_unified_site.js
│   ├── drill_database_restore.js
│   ├── verify_fallback_sync.js
│   ├── research-explorer.js
│   └── sync_scholar.py
│
├── styles/
│   ├── variables.css
│   └── main.css
│
├── tests/
│   ├── helpers/
│   ├── integration/
│   └── ...
│
├── worker/
│   ├── handlers/
│   ├── repositories/
│   ├── middleware/
│   └── index.ts
│
├── current-portfolio-snapshot.json
├── index.html
├── wrangler.toml
└── README.md
```

## Development

Install dependencies:

```bash
npm install
```

Run type checking:

```bash
npm run check-types
```

Run the complete test suite:

```bash
npm run test:all
```

Build the unified site:

```bash
npm run build:site
```

Deploy to Cloudflare:

```bash
npm run deploy
```

## Production

Public site:

https://drlohithjj.in

Administration:

https://drlohithjj.in/dashboard/

Production infrastructure consists of a single Cloudflare Worker serving static assets and routing public, administrative, authentication, and automation APIs backed by Cloudflare D1.

## License

Source code is released under the [MIT License](LICENSE).

Academic content, profile information, publications, photographs, institutional material, and other content belonging to Dr. Lohith J.J. remain subject to their respective ownership and usage rights.

© 2026 Dr. Lohith J.J.
