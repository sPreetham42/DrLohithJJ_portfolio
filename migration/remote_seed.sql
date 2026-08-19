-- Canonical Seed Script for Cloudflare D1

-- Target: portfolio-db

PRAGMA foreign_keys = OFF;


INSERT OR REPLACE INTO assets (
        id, storage_key, filename, mime_type, byte_size, is_primary_photo, created_at, metadata
      ) VALUES ('asset-crsi', 'assets/crsi.svg', 'crsi.svg', 'image/svg+xml', 407372, 0, '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO assets (
        id, storage_key, filename, mime_type, byte_size, is_primary_photo, created_at, metadata
      ) VALUES ('asset-gmail', 'assets/gmail.svg', 'gmail.svg', 'image/svg+xml', 14159, 0, '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO assets (
        id, storage_key, filename, mime_type, byte_size, is_primary_photo, created_at, metadata
      ) VALUES ('asset-headshot', 'assets/Dr Lohith J J.jpeg', 'Dr Lohith J J.jpeg', 'image/jpeg', 266676, 1, '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO assets (
        id, storage_key, filename, mime_type, byte_size, is_primary_photo, created_at, metadata
      ) VALUES ('asset-linkedin', 'assets/linkedin.svg', 'linkedin.svg', 'image/svg+xml', 31682, 0, '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO assets (
        id, storage_key, filename, mime_type, byte_size, is_primary_photo, created_at, metadata
      ) VALUES ('asset-orcid', 'assets/orcid.svg', 'orcid.svg', 'image/svg+xml', 6069, 0, '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO assets (
        id, storage_key, filename, mime_type, byte_size, is_primary_photo, created_at, metadata
      ) VALUES ('asset-scholar', 'assets/google scholar.svg', 'google scholar.svg', 'image/svg+xml', 16259, 0, '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO assets (
        id, storage_key, filename, mime_type, byte_size, is_primary_photo, created_at, metadata
      ) VALUES ('asset-scopus', 'assets/scopus.svg', 'scopus.svg', 'image/svg+xml', 144158, 0, '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO assets (
        id, storage_key, filename, mime_type, byte_size, is_primary_photo, created_at, metadata
      ) VALUES ('asset-vidwan', 'assets/vidwan.svg', 'vidwan.svg', 'image/svg+xml', 10110, 0, '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO assets (
        id, storage_key, filename, mime_type, byte_size, is_primary_photo, created_at, metadata
      ) VALUES ('asset-wos', 'assets/wos.svg', 'wos.svg', 'image/svg+xml', 26060, 0, '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO assets (
        id, storage_key, filename, mime_type, byte_size, is_primary_photo, created_at, metadata
      ) VALUES ('asset-youtube', 'assets/youtube.svg', 'youtube.svg', 'image/svg+xml', 3274, 0, '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO profile (
      id, name, credential, designation, years_experience, current_institution,
      hero_description_line1, hero_description_line2, email_primary, email_secondary,
      phone, address, photo_asset_id, additional_roles_json, professional_memberships_json,
      version, updated_at, metadata
    ) VALUES ('profile', 'Dr. Lohith J.J.', 'Ph.D. — NIT Trichy', 'Professor & Head of Department — CSE (IoT & Cybersecurity including Blockchain Technology)', 20, 'Nagarjuna College of Engineering & Technology, Bengaluru', 'Professor and Head of Department — CSE (IoT & Cybersecurity including Blockchain Technology) at Nagarjuna College of Engineering & Technology, Bengaluru, with over <strong>20 years</strong> of teaching and research experience in Computer Science and Engineering.', 'Doctoral research from <strong>NIT Tiruchirappalli</strong> in Blockchain-Based Smart Contract Security. Resource person at <strong>60+ AICTE-sponsored FDPs and workshops</strong> across NITs and premier institutions. Guest Faculty at <strong>BITS WILP</strong> since 2011.', 'lohithjj@gmail.com', 'lohithjj@wilp.bits-pilani.ac.in', '+91-9886745882', 'NCET, Bengaluru, India', 'assets/Dr Lohith J J.jpeg', '["Guest Faculty at BITS WILP Programme since 2011","Guest Faculty at Manipal Academy of Higher Education (MAHE)","Advisory Committee Member for International Conferences","Doctoral Committee Member and Research Supervisor"]', '["Computer Society of India (CSI) — Life Member","Indian Society for Technical Education (ISTE) — Life Member","Cryptology Research Society of India (CRSI) — Life Member","IEEE — Member"]', 1, '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO scholar_stats (
      id, citations, h_index, i10_index, scie_papers_count, ieee_conferences_count,
      last_updated, source, version, updated_at, metadata
    ) VALUES ('scholarStats', 172, 8, 8, 4, 6, '2026-08-18T01:57:13.894274+00:00', 'google_scholar', 1, '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO publications (
        id, code_number, title, authors, venue, publication_type, year,
        doi, external_url, pdf_asset_id, featured, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES ('pub-j1', 'J1', 'A Systematic Review on Smart Contract Vulnerability Detection Techniques: Challenges and Future Directions', 'Lohith J.J., B. C. S. B., and K. Singh', 'Journal of Systems Architecture, vol. 148, p. 103088 (2024)', 'journal', 2024, NULL, NULL, NULL, 1, 1, 1, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO publications (
        id, code_number, title, authors, venue, publication_type, year,
        doi, external_url, pdf_asset_id, featured, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES ('pub-j2', 'J2', 'Enhancing Oyente: Four New Vulnerability Detections for Improved Smart Contract Security Analysis', 'L. J.J., K. Singh, and B. Chakravarthi', 'International Journal of Information Technology, vol. 16, no. 6, pp. 3389–3399 (2024)', 'journal', 2024, '10.1007/s41870-024-01909-8', 'https://doi.org/10.1007/s41870-024-01909-8', NULL, 1, 1, 2, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO publications (
        id, code_number, title, authors, venue, publication_type, year,
        doi, external_url, pdf_asset_id, featured, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES ('pub-j3', 'J3', 'Digital Forensic Framework for Smart Contract Vulnerabilities Using Ensemble Models', 'L. J.J., K. Singh, and B. Chakravarthi', 'Multimedia Tools and Applications, pp. 1–44 (2023)', 'journal', 2023, '10.1007/s11042-023-17308-3', 'https://doi.org/10.1007/s11042-023-17308-3', NULL, 1, 1, 3, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO publications (
        id, code_number, title, authors, venue, publication_type, year,
        doi, external_url, pdf_asset_id, featured, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES ('pub-j4', 'J4', 'TP-Detect: Trigram-Pixel Based Vulnerability Detection for Ethereum Smart Contracts', 'P. S. Lohith J J et al.', 'Multimedia Tools and Applications, pp. 1–15 (2023)', 'journal', 2023, '10.1007/s11042-023-15042-4', 'https://doi.org/10.1007/s11042-023-15042-4', NULL, 1, 1, 4, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO publications (
        id, code_number, title, authors, venue, publication_type, year,
        doi, external_url, pdf_asset_id, featured, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES ('pub-j5', 'J5', 'Smart Healthcare System with Light-Weighted Blockchain System and Deep Learning Techniques', 'M. S. Lohith J J et al.', 'Computational Intelligence and Neuroscience, vol. 2022 (2022)', 'journal', 2022, '10.1155/2022/1621258', 'https://doi.org/10.1155/2022/1621258', NULL, 1, 1, 5, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO publications (
        id, code_number, title, authors, venue, publication_type, year,
        doi, external_url, pdf_asset_id, featured, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES ('pub-j6', 'J6', 'Energy Efficient Routing Protocol for Wireless Sensor Networks Using Fuzzy Logic', 'Lohith J.J. and B. C. S. B.', 'International Journal of Computer Applications, vol. 112, no. 7 (2015)', 'journal', 2015, NULL, NULL, NULL, 1, 1, 6, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO publications (
        id, code_number, title, authors, venue, publication_type, year,
        doi, external_url, pdf_asset_id, featured, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES ('pub-j7', 'J7', 'Performance Analysis of AODV and DSR Routing Protocols in MANETs', 'Lohith J.J. and S. K.', 'International Journal of Advanced Research in Computer Science, vol. 2, no. 4 (2011)', 'journal', 2011, NULL, NULL, NULL, 1, 1, 7, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO publications (
        id, code_number, title, authors, venue, publication_type, year,
        doi, external_url, pdf_asset_id, featured, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES ('pub-c1', 'C1', 'Vulnerabilities in Smart Contracts: A Detailed Survey of Detection and Mitigation Methodologies', 'N. K. Kumar, N. V. Honnungar, M. Sharwari Prakash, and J. J. Lohith', 'ICETCS 2024, pp. 1–7 (2024)', 'conference', 2024, '10.1109/ICETCS61022.2024.10544155', 'https://doi.org/10.1109/ICETCS61022.2024.10544155', NULL, 1, 1, 8, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO publications (
        id, code_number, title, authors, venue, publication_type, year,
        doi, external_url, pdf_asset_id, featured, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES ('pub-c2', 'C2', 'Enhancing Wireless Sensor Network Longevity and Security: A Quad-LEACH Approach', 'J. J. Lohith, S. Shreya, and J. L. Hamsa Priya', 'ICETCS 2024, pp. 1–6 (2024)', 'conference', 2024, '10.1109/ICETCS61022.2024.10543687', 'https://doi.org/10.1109/ICETCS61022.2024.10543687', NULL, 1, 1, 9, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO publications (
        id, code_number, title, authors, venue, publication_type, year,
        doi, external_url, pdf_asset_id, featured, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES ('pub-c3', 'C3', 'Unlocking Efficiency in Agricultural Supply Chains: A Secure and Transparent Approach Through Blockchain Technology', 'J. J. Lohith, S. Shreya, and J. L. Hamsa Priya', 'ICETCS 2024, pp. 1–6 (2024)', 'conference', 2024, '10.1109/ICETCS61022.2024.10544311', 'https://doi.org/10.1109/ICETCS61022.2024.10544311', NULL, 1, 1, 10, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO publications (
        id, code_number, title, authors, venue, publication_type, year,
        doi, external_url, pdf_asset_id, featured, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES ('pub-c4', 'C4', 'Managing the Supply Chain for Crops Directed from Agricultural Fields Using Blockchains', 'J. J. Lohith et al.', 'ICEARS 2022, pp. 908–913 (2022)', 'conference', 2022, '10.1109/ICEARS53579.2022.9752088', 'https://doi.org/10.1109/ICEARS53579.2022.9752088', NULL, 1, 1, 11, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO publications (
        id, code_number, title, authors, venue, publication_type, year,
        doi, external_url, pdf_asset_id, featured, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES ('pub-c5', 'C5', 'Secure Distributed Medical Record Storage Using Blockchain and Emergency Sharing Using Multi-Party Computation', 'Lohith J.J. et al.', 'NTMS 2021, pp. 1–5 (2021)', 'conference', 2021, '10.1109/NTMS49979.2021.9432643', 'https://doi.org/10.1109/NTMS49979.2021.9432643', NULL, 1, 1, 12, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO publications (
        id, code_number, title, authors, venue, publication_type, year,
        doi, external_url, pdf_asset_id, featured, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES ('pub-c6', 'C6', 'Intensifying the Lifetime of WSN Using a Centralized Energy Accumulator Node with RF Energy Transmission', 'L. J.J. and B. C. S. B.', 'IADCC 2015, pp. 1–6 (2015)', 'conference', 2015, '10.1109/IADCC.2015.7154694', 'https://doi.org/10.1109/IADCC.2015.7154694', NULL, 1, 1, 13, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-1', 'Cyber Security and Digital Ethics', 'VIT, Pune (FDP)', 'Feb 27, 2026', 2026, 1, 1, 1, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-2', 'Blockchain Technology in Education', 'UGC Malaviya Mission Teacher Centre, Bengaluru University', 'Jan 28, 2026', 2026, 1, 1, 2, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-3', 'Blockchain and Hands-on Smart Contracts', 'RNSIT, Bengaluru', 'Oct 11, 2025', 2025, 1, 1, 3, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-4', 'Blockchain and Smart Contracts', 'DSCE, Bengaluru', 'Sep 11, 2025', 2025, 1, 1, 4, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-5', 'Protecting Intellectual Property Rights', 'SJCIT, Chikkaballapura', 'Aug 30, 2025', 2025, 1, 1, 5, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-6', 'Deploying Smart Contracts', 'NIT Jamshedpur (STC on Blockchain & Applications)', 'Jun 4, 2025', 2025, 1, 1, 6, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-7', 'Personality Development — Induction Program', 'VTU PG Center, Muddenahalli', 'Apr 24, 2025', 2025, 1, 1, 7, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-8', 'Blockchain & Smart Contracts — 2-Day VAC', 'Cambridge Institute of Technology, Bengaluru', 'Mar 10–11, 2025', 2025, 1, 1, 8, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-9', 'Deploying Smart Contracts', 'Vishwakarma Institute of Technology, Pune', 'Feb 13, 2025', 2025, 1, 1, 9, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-10', 'Session Chair — ICIIICEE 2025', 'BNMIT, Bengaluru', 'Jan 17, 2025', 2025, 0, 1, 10, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-11', 'Deploying Smart Contracts — ISEA FUP on Next Gen Security', 'NIT Kurukshetra', 'Dec 28, 2024', 2024, 0, 1, 11, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-12', 'Transforming AI With Healthcare — EWASH Conference', 'VTU PG Center, Muddenahalli', 'Dec 14, 2024', 2024, 0, 1, 12, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-13', 'Blockchain & Ethereum Smart Contracts', 'Bangalore Institute of Technology, Bengaluru', 'Nov 14, 2024', 2024, 0, 1, 13, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-14', 'Blockchain & Smart Contracts — 3-Day VAC', 'P.A. College of Engineering, Mangaluru', 'Oct 7–9, 2024', 2024, 0, 1, 14, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-15', 'Essentials of Programming Language', 'VTU PG Center, Muddenahalli', 'Oct 3, 2024', 2024, 0, 1, 15, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-16', 'Introduction to Cryptocurrency & Technology Behind It', 'Arohan Lecture 14, DTE Bengaluru', 'Sep 17, 2024', 2024, 0, 1, 16, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-17', 'Exploring Cisco Packet Tracer Tool', 'NCET, Dept of CSE(AI&ML), Bengaluru', 'Jun 11, 2024', 2024, 0, 1, 17, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-18', 'Blockchain & Smart Contracts — 3-Day VAC', 'NCET, Dept of CSE(DS), Bengaluru', 'May 27–29, 2024', 2024, 0, 1, 18, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-19', 'Cybersecurity and its Attacks', 'DSCE, Bengaluru', 'Jan 2, 2024', 2024, 0, 1, 19, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-20', 'Cybersecurity and its Attacks', 'SJCIT, Chikkaballapura', 'Dec 20, 2023', 2023, 0, 1, 20, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-21', 'Blockchain and its Applications — 2-Day Workshop', 'Alva''s College of Engineering, Moodbidre', 'Nov 20–21, 2023', 2023, 0, 1, 21, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-22', 'Blockchain and its Applications — 2-Day Workshop', 'Manipal Institute of Technology, Manipal', 'Nov 10–11, 2023', 2023, 0, 1, 22, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-23', 'Blockchain Technology — FDP', 'MLWCE, Hyderabad', 'Mar 28, 2023', 2023, 0, 1, 23, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-24', 'Current Trends in Blockchain & CyberSecurity — FDP', 'BMSCE, Bengaluru', 'Mar 20–26, 2023', 2023, 0, 1, 24, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-25', 'Introduction to Cryptology — DST-SERB Workshop', 'NIT Tiruchirappalli', 'Jan 11–12, 2023', 2023, 0, 1, 25, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-26', 'Blockchain & IOT Applications — FDP', 'MSRUAS, Bengaluru', 'Aug 11, 2022', 2022, 0, 1, 26, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-27', 'Blockchain & AWS — 3-Day FDP', 'Reva University, Bengaluru', 'Jul 25–27, 2022', 2022, 0, 1, 27, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-28', 'Introduction to Cryptocurrency & Blockchain', 'RVCE, Bengaluru', 'May 30, 2022', 2022, 0, 1, 28, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-29', 'Blockchain & Hands on Ethereum Smart Contracts — Workshop', 'SVIT, Bengaluru', 'May 19–20, 2022', 2022, 0, 1, 29, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-30', 'Introduction to Blockchain', 'HNSNC, Virudhunagar, Tamil Nadu', 'May 10, 2022', 2022, 0, 1, 30, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-31', 'Blockchain & Hands on Ethereum Smart Contracts — 2-Day Workshop', 'AIT, Chikkamagaluru', 'Apr 29–30, 2022', 2022, 0, 1, 31, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-32', 'Recent Trends in Cyber Security & Blockchain — FDP', 'VVCE, Mysuru', 'Apr 20–21, 2022', 2022, 0, 1, 32, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-33', 'Blockchain Technologies and Applications — ATAL FDP', 'Manipal Institute of Technology', 'Dec 6–10, 2021', 2021, 0, 1, 33, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-34', 'Lightweight Cryptography for IoT & Blockchain — ATAL FDP', 'UIT RGPV, Bhopal', 'Jul 28, 2021', 2021, 0, 1, 34, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-35', 'Blockchain & Smart Contract Technology — FDP', 'NIT Tiruchirappalli', 'Jun 26, 2021', 2021, 0, 1, 35, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-36', 'Challenges & Research Directions for Blockchains in IoT — STTP', 'Sona College of Engineering, Salem', 'Feb 11, 2021', 2021, 0, 1, 36, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-37', 'Blockchain & Use Cases — ATAL FDP', 'BNMIT, Bengaluru', 'Jan 18–19, 2021', 2021, 0, 1, 37, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-38', 'Writing Smart Contracts Using Ethereum — AICTE STTP', 'Sona College of Engineering, Salem', 'Jan 5–6, 2021', 2021, 0, 1, 38, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-39', 'Research Challenges in Blockchain Technology — ATAL FDP', 'Sona College of Engineering, Salem', 'Dec 14, 2020', 2020, 0, 1, 39, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-40', 'Introduction to Ethereum Smart Contracts', 'LBSITW', 'Nov 25, 2020', 2020, 0, 1, 40, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-41', 'Hands-on Ethereum Smart Contracts — ATAL FDP', 'Bangalore Institute of Technology', 'Nov 24, 2020', 2020, 0, 1, 41, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-42', 'Blockchain Technology — Expert Talk', 'BMSIT, Bengaluru', 'Jun 22, 2020', 2020, 0, 1, 42, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-att-1', 'Python Programming — Online One-Week FDP (Attended)', 'MHRD & IIT Bombay', '2020', 2020, 0, 1, 45, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-att-2', 'Blockchain Architecture Design & Use Cases — 3-Week STTP (Attended)', 'AICTE', '2020', 2020, 0, 1, 46, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-43', 'Blockchain Technology — National Conference on BSCT', 'NIT Tiruchirappalli', '2019', 2019, 0, 1, 43, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-att-3', 'Intellectual Property Rights, Technology Development & Startup (Attended)', 'NIT Tiruchirappalli', '2019', 2019, 0, 1, 47, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-44', 'Guest Lectures Series in Blockchain & Networks', 'Krupanidhi Degree College & PES Polytechnic, Bengaluru', '2018 — 2023', 2018, 0, 1, 44, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-att-4', 'Pseudospectral Methods in Differential Equations — 2-Week GIAN FDP (Attended)', 'GIAN', '2018', 2018, 0, 1, 48, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-att-5', 'Software Engineering — Short Term Course (Attended)', 'Dept of CSE, NIT Tiruchirappalli', '2017', 2017, 0, 1, 49, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-att-6', 'Introduction to Algorithms — Short Term Course (Attended)', 'Dept of CSE, NIT Tiruchirappalli', '2017', 2017, 0, 1, 50, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-att-7', 'Introduction to Cryptography — Short Term Course (Attended)', 'Dept of CSE, NIT Tiruchirappalli', '2017', 2017, 0, 1, 51, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-att-8', 'Computer Networking — 2-Week ISTE Workshop (Attended)', 'IIT Bombay & ISTE', '2014', 2014, 0, 1, 52, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('talk-att-9', 'Faculty Orientation Program (Attended)', 'BMSCE, Bengaluru', '2011', 2011, 0, 1, 53, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO experience (
        id, role, organization, start_year, end_year, is_current,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('exp-1', 'Professor & Head, Dept. of CSE(IoT & CyberSecurity including Blockchain Technology)', 'Nagarjuna College of Engineering & Technology, Bengaluru', 'May 2026', 'Present', 1, 1, 1, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO experience (
        id, role, organization, start_year, end_year, is_current,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('exp-2', 'Professor & Head, Dept. of AI & ML', 'Nagarjuna College of Engineering and Technology, Bengaluru', 'May 2024', 'May 2026', 0, 1, 2, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO experience (
        id, role, organization, start_year, end_year, is_current,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('exp-3', 'Assistant Professor, Dept. of CSE', 'B.M.S. College of Engineering, Bengaluru', 'May 2011', 'May 2024', 0, 1, 3, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO experience (
        id, role, organization, start_year, end_year, is_current,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('exp-4', 'Senior Lecturer, Dept. of CSE', 'Auden Technology and Management Academy', 'Aug 2009', 'May 2011', 0, 1, 4, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO experience (
        id, role, organization, start_year, end_year, is_current,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('exp-5', 'Lecturer, Dept. of ISE', 'A.P.S. College of Engineering', 'Aug 2007', 'Jul 2009', 0, 1, 5, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO experience (
        id, role, organization, start_year, end_year, is_current,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('exp-6', 'Lecturer, Dept. of ISE', 'Yellamma Dasappa Institute of Technology', 'Aug 2005', 'Jul 2006', 0, 1, 6, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO education (
        id, degree, institution, year, thesis, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('edu-phd', 'Ph.D., National Institute of Technology (NIT), Tiruchirappalli', 'National Institute of Technology, Tiruchirappalli', '2024', 'Thesis: "Blockchain-Based Smart Contract Security: Frameworks for Vulnerability Detection and Secure Execution"', 1, 1, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO education (
        id, degree, institution, year, thesis, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('edu-mtech', 'M.Tech. — Computer Network and Engineering', 'D.S.C.E., V.T.U. — 77%', '2009', NULL, 1, 2, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO education (
        id, degree, institution, year, thesis, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES ('edu-be', 'B.E. — Computer Science and Engineering', 'B.N.M.I.T., V.T.U. — 68%', '2005', NULL, 1, 3, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-1', 'Excellence in Research Award', 'National Education Brilliance 2024, New Delhi', '2024', NULL, NULL, 1, 1, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-2', 'BEST RESOURCE PERSON Golden Award 2024', 'Wisdom Educare Academy, Chennai, Tamil Nadu', '2024', NULL, NULL, 1, 2, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-3', 'Resource Person at Premier NITs (NIT Trichy, Kurukshetra, Durgapur, Jamshedpur)', 'Delivered expert talks on Blockchain & Smart Contracts', 'Various', NULL, NULL, 1, 3, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-4', 'Authored Textbook on Data Communications & Networking', 'B.C.A. IV Sem, Bangalore University', '2024', NULL, NULL, 1, 4, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-5', 'Developed Video Content for VTU BCA & MCA Students', 'Visvesvaraya Technological University (VTU)', 'May 2025', NULL, NULL, 1, 5, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-6', 'Served as BOS & BOE Chairman', 'Academic Board of Studies & Board of Examiners', 'Various', NULL, NULL, 1, 6, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-7', 'Served as Institute Ethics Committee Chairman', 'Nagarjuna College of Engineering & Technology (NCET)', 'Various', NULL, NULL, 1, 7, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-8', 'Served as Hostel Secretary', 'Nagarjuna College of Engineering & Technology (NCET)', 'Various', NULL, NULL, 1, 8, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-9', 'Serving as Co-guide for Research Department', 'MAHE, Bengaluru', 'Present', NULL, NULL, 1, 9, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-10', 'Jury Member — Blockchain Project Presentation Event', 'Linux Foundation Decentralized Trust (LFDT) India Chapter', '2024', NULL, NULL, 1, 10, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-11', 'Doctoral Advisory Committee Member', 'MAHE, Manipal', 'Present', NULL, NULL, 1, 11, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-12', 'Evaluator for Toycathon 2021', 'Ministry of Education & AICTE', '2021', NULL, NULL, 1, 12, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-13', 'Reviewer for Journal of Concurrency and Computation', 'Wiley — Practice and Experience Journal', 'Present', NULL, NULL, 1, 13, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-14', 'Resource Person for 40+ AICTE Sponsored Workshops & FDPs', 'Delivered talks on Blockchain and Smart Contracts across 40+ FDPs', 'Various', NULL, NULL, 1, 14, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-15', 'Serving as Guest Faculty at BITS WILP Programme', 'BITS Pilani Work Integrated Learning Programmes', '2011 — Present', NULL, NULL, 1, 15, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-16', 'Served as Guest Faculty', 'Manipal Global Education Services (MAGE)', 'Various', NULL, NULL, 1, 16, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-17', 'Completed Summer School on Machine Learning', 'BITS Pilani, Hyderabad Campus', 'Various', NULL, NULL, 1, 17, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-18', 'Mentored UG IUCEE Project (Grade A) & Proceedings Author', 'IUCEE Foundation — Project: Blockchain mapping of products', 'Various', NULL, NULL, 1, 18, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-19', 'Mentored Samsung Prism Worklet & Wipro Project Campus Trainer', 'Samsung Prism (Excellent Grade) & WIPRO (2011)', '2011 — Present', NULL, NULL, 1, 19, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-20', 'Faculty for Infosys Campus Connect Program', 'Infosys Technologies Limited — DS, Client-Server, Unix, DBMS', 'Various', NULL, NULL, 1, 20, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-21', 'Life Member of Professional Societies (CSI, ISTE, CRSI)', 'Computer Society of India, ISTE, Cryptology Research Society of India', 'Lifetime', NULL, NULL, 1, 21, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-22', 'Valuator for VTU Theory & Practical Examinations', 'Visvesvaraya Technological University (VTU)', 'June 2007 — Present', NULL, NULL, 1, 22, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-23', 'Exam Coordinator for VTU Theory Examinations', 'Visvesvaraya Technological University (VTU)', '2007 — 2008', NULL, NULL, 1, 23, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-24', 'Worked as Hostel Warden in B.M.S. Hostel', 'B.M.S. Hostel', 'Feb 2022 — Apr 2024', NULL, NULL, 1, 24, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES ('award-25', 'Vice Chairman — B.M.S. Employees Credit Co-operative Society', 'B.M.S. Employees Credit Co-operative Society', 'Nov 2023 — Apr 2024', NULL, NULL, 1, 25, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO skill_categories (
        id, category, skills_json, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES ('skill-cat-1', 'Domain Expertise', '["Blockchain","Cryptography","Computer Networks","Cyber Security","Compiler Design","Network Security","Machine Learning","Smart Contracts"]', 1, 1, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO skill_categories (
        id, category, skills_json, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES ('skill-cat-2', 'Practical Tools & Skills', '["Cisco Packet Tracer","Wireshark","Social Engineering Tool Kit","Metamask","Remix IDE","Designing & Deploying Smart Contracts","Web3 & DApps","CrypTool","Animal Tool","Excel Script Analysis"]', 1, 2, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO skill_categories (
        id, category, skills_json, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES ('skill-cat-3', 'Administration & Governance', '["NBA Coordinator (UG)","NIRF Cell Member","BOS & BOE Chairman","Ethics Committee Chairman","Hostel Secretary","Hostel Warden","Syllabus Design","FDP Convener","Credit Co-op Vice Chairman","Exam Coordinator","OBE & GAPC v4 Framework"]', 1, 3, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO skill_categories (
        id, category, skills_json, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES ('skill-cat-4', 'Languages & Misc.', '["English","Kannada","Telugu","Hindi","Academic Research","Teaching & Consultation","LaTeX Typesetting","Publishing"]', 1, 4, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO social_links (
        id, platform, url, icon, display_order, visible,
        published, version, created_at, updated_at, metadata
      ) VALUES ('social-scholar', 'Google Scholar', 'https://scholar.google.com/citations?user=dmSdWtEAAAAJ&hl=en', 'google scholar.svg', 1, 1, 1, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO social_links (
        id, platform, url, icon, display_order, visible,
        published, version, created_at, updated_at, metadata
      ) VALUES ('social-orcid', 'ORCID', 'https://orcid.org/0000-0002-3928-1123', 'orcid.svg', 2, 1, 1, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO social_links (
        id, platform, url, icon, display_order, visible,
        published, version, created_at, updated_at, metadata
      ) VALUES ('social-linkedin', 'LinkedIn', 'https://www.linkedin.com/in/dr-lohith-j-j-2680aa50/', 'linkedin.svg', 3, 1, 1, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO social_links (
        id, platform, url, icon, display_order, visible,
        published, version, created_at, updated_at, metadata
      ) VALUES ('social-scopus', 'Scopus', 'https://www.scopus.com/authid/detail.uri?authorId=57211475143', 'scopus.svg', 4, 1, 1, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO social_links (
        id, platform, url, icon, display_order, visible,
        published, version, created_at, updated_at, metadata
      ) VALUES ('social-wos', 'Web of Science', 'https://www.webofscience.com/wos/author/record/K-7399-2019', 'wos.svg', 5, 1, 1, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO social_links (
        id, platform, url, icon, display_order, visible,
        published, version, created_at, updated_at, metadata
      ) VALUES ('social-vidwan', 'Vidwan', 'https://vidwan.inflibnet.ac.in/profile/204898', 'vidwan.svg', 6, 1, 1, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT OR REPLACE INTO social_links (
        id, platform, url, icon, display_order, visible,
        published, version, created_at, updated_at, metadata
      ) VALUES ('social-crsi', 'CRSI', 'http://www.crsi.org.in/', 'crsi.svg', 7, 1, 1, 1, '2026-08-19T06:59:34.202Z', '2026-08-19T06:59:34.202Z', NULL);

INSERT INTO revisions (
      id, entity_type, entity_id, version, action, payload_json, author, created_at
    ) VALUES ('rev-baseline-7e74a9f29f6e', 'migration_baseline', 'snapshot-v1', 1, 'import', '{"type":"initial_import_baseline","snapshotVersion":"1.0.0-canonical-frozen","snapshotSha256":"7e74a9f29f6ed0b1aedc09cc0e1e0118a3e20a032c2353d0c4d9aa3cde4a9dbf","totalEntities":122}', 'migration-runner', '2026-08-19T06:59:34.202Z');


PRAGMA foreign_keys = ON;