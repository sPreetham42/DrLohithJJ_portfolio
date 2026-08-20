# SANITY CMS RETIREMENT & CLOUDFLARE D1 BACKUP ARCHIVE

> [!IMPORTANT]
> **HISTORICAL ARCHIVE ONLY — SANITY CMS IS PERMANENTLY RETIRED IN PRODUCTION**
> Cloudflare D1 is the sole production source of truth for all application data.
> The files in this directory exist purely as immutable historical backups and cryptographic records.

## Executive Summary
This directory contains the permanent cryptographic archive of the legacy Sanity CMS dataset and the standalone production backup of Cloudflare D1 for the Dr. Lohith J.J. Academic Portfolio.

## Archive Manifest

### 1. Legacy Sanity Final Archive
* **File:** `data/archive/sanity_final_archive.json`
* **Source:** Sanity CMS (`projectId: 12ok6v8i`, `dataset: production`)
* **Archived At:** 2026-08-19T00:00:00.000Z
* **Total Documents:** 108
* **SHA-256 Checksum:** `a03e497769adabfa0e504d1bf239b49d8e400845db7dda57e6bb0387a83dadbd`

### 2. Cloudflare D1 Production Backup
* **File:** `data/archive/d1_production_backup.json`
* **Database:** `portfolio-db`
* **Archived At:** 2026-08-19T00:00:00.000Z
* **Table Counts:**
  * Publications: 13
  * Invited Talks: 53
  * Awards & Grants: 25
  * Experience: 6
  * Education: 3
  * Skill Categories: 4
  * Social Links: 7
* **SHA-256 Checksum:** `6029f886e5fc0be5377d67211537ff6d8b0f3d1c00b9e1e9a117cd31a827c8e1`

## Restoration Instructions
1. **D1 Restore:** In an empty SQLite database or D1 instance, apply SQL migrations `migrations/0001_initial_schema.sql` and run `node migration/import_d1.js`.
2. **Sanity Restore (Disaster Recovery Only):** To restore into an empty Sanity dataset, use Sanity CLI:
   ```bash
   npx @sanity/cli dataset import data/archive/sanity_final_archive.json production --replace
   ```
