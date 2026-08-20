# Phase 1 Migration Foundation: Current Portfolio → D1

> [!NOTE]
> **HISTORICAL MIGRATION RECORD & TEST HARNESS**
> This directory documents the completed migration from legacy CMS to Cloudflare D1.
> The scripts and tests herein provide deterministic verification and provenance.

This directory contains the deterministic, validated data migration pipeline for transitioning the Dr. Lohith J.J. academic portfolio from legacy Sanity CMS to Cloudflare D1.

---

## 1. Core Architecture Principles

1. **Source of Truth:** The canonical migration source is `current-portfolio-snapshot.json` (derived from the active verified portfolio codebase), **NOT** Sanity.
2. **Deterministic Cryptography:** Every record and snapshot is validated with Zod, normalized with recursive key sorting, and hashed with SHA-256 in `migration-manifest.json`.
3. **Optimistic Concurrency & Audit History:** Every table features a `version` column and a dedicated `revisions` audit log.
4. **Idempotence & Safety:** The SQL import engine uses `INSERT OR REPLACE` transactions and strict dry-run validation (`--dry-run`).
5. **Zero ORM / Zero Over-Engineering:** Pure SQL D1 queries via typed repository interfaces.

---

## 2. Directory Structure

```text
├── current-portfolio-snapshot.json   # Canonical frozen source dataset
├── migration/
│   ├── README.md                     # Migration documentation
│   ├── validate_snapshot.js          # Zod schema & logical validation runner
│   ├── normalize_snapshot.js         # Deterministic deep-sorting & whitespace normalizer
│   ├── generate_manifest.js          # Cryptographic SHA-256 manifest generator
│   ├── import_d1.js                  # D1 SQL seed generator & dry-run import runner
│   ├── verify_parity.js              # Post-import 100% parity verification checker
│   ├── test_suite_phase1.js          # Complete 34-assertion automated test runner
│   ├── migration-manifest.json       # SHA-256 tracked record manifest
│   └── migration-manifest.sha256     # Manifest file checksum
├── db/
│   └── migrations/
│       ├── 0001_initial_schema.sql   # Relational D1 schema & performance indexes
│       └── 0002_create_revisions.sql # Audit revision history table
├── worker/
│   ├── types.ts                      # Core D1 record interfaces
│   ├── validation/
│   │   ├── schemas.ts                # Zod schemas (TypeScript)
│   │   └── schemas.js                # Zod schemas (ES Module)
│   └── repositories/                 # Typed D1 repository layer (No ORM)
│       ├── profile.repository.ts
│       ├── scholar.repository.ts
│       ├── publication.repository.ts
│       ├── talk.repository.ts
│       ├── experience.repository.ts
│       ├── education.repository.ts
│       ├── award.repository.ts
│       ├── skill.repository.ts
│       ├── social.repository.ts
│       ├── asset.repository.ts
│       └── revision.repository.ts
```

---

## 3. CLI Commands

```bash
# Validate snapshot against Zod schema
npm run snapshot:validate

# Normalize snapshot deterministically
npm run snapshot:normalize

# Generate cryptographic migration manifest
npm run snapshot:manifest

# Execute dry-run import (0 DB changes)
npm run db:import:dry-run

# Run full Phase 1.5 verification suite (110 tests)
npm run test:phase1
```
