# Source-of-Truth Decision Log

This document records all material data conflicts encountered during the forensic audit of the Dr. Lohith J.J. academic portfolio, the competing sources evaluated, the authoritative winning value, and the factual verification rationale.

---

## Decision Record Index

1. [Scholar Metrics: Total Citations](#1-scholar-metrics-total-citations)
2. [Scholar Metrics: h-index & i10-index](#2-scholar-metrics-h-index--i10-index)
3. [Profile: Academic Leadership & HOD Department Designation](#3-profile-academic-leadership--hod-department-designation)
4. [Profile: Academic Credential Presentation](#4-profile-academic-credential-presentation)
5. [Experience: Current Appointment Start Date](#5-experience-current-appointment-start-date)
6. [Education: Graduation Year Formatting](#6-education-graduation-year-formatting)
7. [Publications: Resolvable DOI Links & Clickability](#7-publications-resolvable-doi-links--clickability)
8. [Publications: Default Featured Status for Future Entries](#8-publications-default-featured-status-for-future-entries)
9. [Social Links: Active Academic Identity Profiles](#9-social-links-active-academic-identity-profiles)
10. [Media Assets: Headshot & Brand Vectors](#10-media-assets-headshot--brand-vectors)

---

### 1. Scholar Metrics: Total Citations
* **Entity:** `scholar_stats` (Singleton `_id: "scholarStats"`)
* **Field:** `citations`
* **Competing Source A (Sanity):** `168`
* **Competing Source B (Current Portfolio / Live Scholar):** `172` (cache `data/scholar.json`)
* **Winning Value:** `172`
* **Winning Source:** Current Portfolio / Live Google Scholar
* **Reason:** Verified live against Google Scholar author profile ID `dmSdWtEAAAAJ`. Sanity document write had stalled due to empty project ID environment parsing in GitHub Actions.
* **Date / Context:** 2026-08-18 Forensic Audit.

---

### 2. Scholar Metrics: h-index & i10-index
* **Entity:** `scholar_stats`
* **Field:** `h_index`, `i10_index`
* **Competing Source A (Sanity):** `h_index: 7`, `i10_index: 5`
* **Competing Source B (Current Portfolio / Live Scholar):** `h_index: 8`, `i10_index: 8`
* **Winning Value:** `h_index: 8`, `i10_index: 8`
* **Winning Source:** Current Portfolio / Live Google Scholar
* **Reason:** Verified live against Google Scholar metrics for `dmSdWtEAAAAJ`.
* **Date / Context:** 2026-08-18 Forensic Audit.

---

### 3. Profile: Academic Leadership & HOD Department Designation
* **Entity:** `profile` (Singleton `_id: "profile"`)
* **Field:** `designation`, `hero_description_line1`, `hero_description_line2`
* **Competing Source A (Sanity):** Bio line 2 references older appointment: *"Currently Professor & Head of Dept. of AI & ML at NCET"*
* **Competing Source B (Current Portfolio):** *"Professor and Head of Department — CSE (IoT & Cybersecurity including Blockchain Technology) at Nagarjuna College of Engineering & Technology, Bengaluru"*
* **Winning Value:** Current Portfolio text
* **Winning Source:** Current Portfolio (`index.html`)
* **Reason:** Reflects Dr. Lohith's current academic appointment and institutional department title.
* **Date / Context:** 2026-08-18 Content Audit.

---

### 4. Profile: Academic Credential Presentation
* **Entity:** `profile`
* **Field:** `credential`
* **Competing Source A (Sanity):** `"Ph.D. (NIT Trichy)"`
* **Competing Source B (Current Portfolio):** `"Ph.D. — NIT Trichy"`
* **Winning Value:** `"Ph.D. — NIT Trichy"`
* **Winning Source:** Current Portfolio (`index.html`)
* **Reason:** Follows approved editorial typographic standards (em-dash separator).
* **Date / Context:** 2026-08-18 Visual Typography Alignment.

---

### 5. Experience: Current Appointment Start Date
* **Entity:** `experience` (ID: `exp-1`)
* **Field:** `start_year`
* **Competing Source A (Sanity):** `"June 2026"`
* **Competing Source B (Current Portfolio):** `"May 2026"`
* **Winning Value:** `"May 2026"`
* **Winning Source:** Current Portfolio (`index.html`)
* **Reason:** Explicitly corrected by user in `index.html` to reflect actual appointment date.
* **Date / Context:** 2026-08-18 Timeline Verification.

---

### 6. Education: Graduation Year Formatting
* **Entity:** `education` (IDs: `edu-be`, `edu-mtech`, `edu-phd`)
* **Field:** `year`
* **Competing Source A (Sanity):** Date spans (`"2001 — 2005"`, `"2006 — 2009"`, `"2017 — 2024"`)
* **Competing Source B (Current Portfolio):** Graduation years (`"2005"`, `"2009"`, `"2024"`)
* **Winning Value:** Single graduation year strings (`"2005"`, `"2009"`, `"2024"`)
* **Winning Source:** Current Portfolio (`index.html`)
* **Reason:** Degree cards in public portfolio UI are formatted with graduation years rather than matriculation spans.
* **Date / Context:** 2026-08-18 Education Section Alignment.

---

### 7. Publications: Resolvable DOI Links & Clickability
* **Entity:** `publications` (IDs: `pub-j1` to `pub-j7`, `pub-c1` to `pub-c6`)
* **Field:** `doi`, `external_url`
* **Competing Source A (Sanity):** Bare DOI strings (e.g. `"10.1007/s41870-024-01909-8"`) without external resolution URLs.
* **Competing Source B (Current Portfolio):** Full anchor links with `https://doi.org/10.1007/s41870-024-01909-8`.
* **Winning Value:** Stored `doi` as canonical identifier + `external_url` as full HTTPS resolver link. (Unlinked papers J1, J6, J7 have `doi: null, external_url: null`).
* **Winning Source:** Current Portfolio (`index.html`)
* **Reason:** Ensures direct clickability for all 10 DOI-bearing papers while maintaining nullable fields for non-DOI publications.
* **Date / Context:** 2026-08-18 Publication Clickability Upgrade.

---

### 8. Publications: Default Featured Status for Future Entries
* **Entity:** `publications`
* **Field:** `featured` column default value
* **Competing Option A:** `DEFAULT 1` (legacy all-featured)
* **Competing Option B:** `DEFAULT 0` (editorial best practice)
* **Winning Value:** `DEFAULT 0`
* **Winning Source:** Phase 1.5 Architecture Review
* **Reason:** Future editorial safety. All 13 existing publications in `current-portfolio-snapshot.json` are explicitly imported with `featured: 1`, while new future publications created via Admin SPA will start as standard (unfeatured) unless explicitly toggled.
* **Date / Context:** 2026-08-18 Phase 1.5 Review Gate.

---

### 9. Social Links: Active Academic Identity Profiles
* **Entity:** `social_links`
* **Field:** Full collection
* **Competing Source A (Sanity):** 3 legacy links (Google Scholar, LinkedIn, Twitter/X)
* **Competing Source B (Current Portfolio):** 7 active links (Google Scholar, ORCID, LinkedIn, Scopus, Web of Science, Vidwan, CRSI)
* **Winning Value:** 7 active verified links
* **Winning Source:** Current Portfolio (`index.html`)
* **Reason:** Dr. Lohith's active public rail connects visitors to 7 verified academic registries. Twitter/X was deprecated.
* **Date / Context:** 2026-08-18 Identity Rail Audit.

---

### 10. Media Assets: Headshot & Brand Vectors
* **Entity:** `assets`
* **Field:** Active image & icon collection
* **Competing Source A (Sanity CDN):** 2 low-resolution assets (`images.jpg` 225px thumbnail, `aayush.jpg` test asset)
* **Competing Source B (Current Portfolio / Local Repo):** 10 high-resolution assets in `assets/` (including `Dr Lohith J J.jpeg` 260KB headshot, `crsi.svg` 397KB vector, `scopus.svg`, `wos.svg`, etc.)
* **Winning Value:** 10 local active repository assets
* **Winning Source:** Local repository (`assets/`)
* **Reason:** Preserves high-fidelity vectors and original headshot; test image `aayush.jpg` is retired.
* **Date / Context:** 2026-08-18 Asset Inventory Audit.
