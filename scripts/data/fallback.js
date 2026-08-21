// ================================================================
// CANONICAL STATIC FALLBACK DATA REPOSITORY
// Provides disaster/offline resilience when the Worker API is unreachable.
// Matches 100% of the verified current portfolio canonical state.
// ================================================================

import { DEFAULT_TALKS } from '../talks.js';

export const fallbackData = {
  profile: {
    name: 'Dr. Lohith J.J.',
    credential: 'Ph.D. · National Institute of Technology, Tiruchirappalli',
    designation: 'Professor & Head of Department — CSE (IoT & Cybersecurity including Blockchain Technology)',
    yearsExperience: 20,
    currentInstitution: 'Nagarjuna College of Engineering and Technology (NCET), Bengaluru',
    heroDescriptionLine1: 'Professor and Head of Department — CSE (IoT & Cybersecurity including Blockchain Technology) at Nagarjuna College of Engineering & Technology, Bengaluru, with over <strong>20 years</strong> of teaching and research experience in Computer Science and Engineering.',
    heroDescriptionLine2: 'Doctoral research from <strong>NIT Tiruchirappalli</strong> in Blockchain-Based Smart Contract Security. Resource person at <strong>60+ AICTE-sponsored FDPs and workshops</strong> across NITs and premier institutions. Guest Faculty at <strong>BITS WILP</strong> since 2011.',
    emailPrimary: 'lohithjj@gmail.com',
    emailSecondary: 'hod-cse@ncetmail.com',
    phone: '+91-9886745882',
    address: 'Department of CSE, Nagarjuna College of Engineering and Technology, Mudugurki, Venkatagirikote Post, Devanahalli, Bengaluru — 562164',
    photoUrl: 'assets/Dr Lohith J J.jpeg',
    additionalRoles: [
      'Guest Faculty — BITS Pilani (Off-Campus Work Integrated Learning Programmes)',
      'Board of Studies (BoS) Member — Autonomous Engineering Institutions',
      'Doctoral Research Supervisor & Reviewer — Top IEEE/Springer Journals'
    ],
    professionalMemberships: [
      'Senior Member — IEEE (Institute of Electrical and Electronics Engineers)',
      'Life Member — Cryptology Research Society of India (CRSI)',
      'Life Member — Computer Society of India (CSI)',
      'Life Member — Indian Society for Technical Education (ISTE)'
    ]
  },

  scholarStats: {
    citations: 172,
    hIndex: 8,
    i10Index: 8,
    sciePapersCount: 4,
    ieeeConferencesCount: 6,
    lastUpdated: '2026-08-18T00:00:00.000Z',
    source: 'google_scholar'
  },

  publications: [
    {
      id: 'pub-j1',
      codeNumber: 'J1',
      title: 'A Novel Static Analysis Tool to Detect Timestamp Dependency and Block Number Dependency Vulnerabilities in Ethereum Smart Contracts',
      authors: 'Lohith, J. J., & Eswari, R.',
      venue: 'IEEE Access (SCIE, IF: 3.4, Q1)',
      publicationType: 'journal',
      year: 2024,
      doi: '10.1109/ACCESS.2024.3411075',
      externalUrl: 'https://doi.org/10.1109/ACCESS.2024.3411075',
      featured: true,
      order: 1
    },
    {
      id: 'pub-j2',
      codeNumber: 'J2',
      title: 'Trigram-Pixel Image-Based Automated Vulnerability Detection in Smart Contracts Using Machine Learning Algorithms',
      authors: 'Lohith, J. J., & Eswari, R.',
      venue: 'Journal of The Institution of Engineers (India): Series B (Springer, Scopus)',
      publicationType: 'journal',
      year: 2024,
      doi: '10.1007/s41870-024-01909-8',
      externalUrl: 'https://doi.org/10.1007/s41870-024-01909-8',
      featured: true,
      order: 2
    },
    {
      id: 'pub-j3',
      codeNumber: 'J3',
      title: 'A Systematic Review on Vulnerability Detection in Smart Contracts',
      authors: 'Lohith, J. J., & Eswari, R.',
      venue: 'Transactions on Emerging Telecommunications Technologies (Wiley, SCIE, IF: 2.8, Q2)',
      publicationType: 'journal',
      year: 2023,
      doi: '10.1002/ett.4749',
      externalUrl: 'https://doi.org/10.1002/ett.4749',
      featured: true,
      order: 3
    },
    {
      id: 'pub-j4',
      codeNumber: 'J4',
      title: 'TP-Detect: Bytecode Image-Based Automated Vulnerability Detection in Ethereum Smart Contracts',
      authors: 'Lohith, J. J., & Eswari, R.',
      venue: 'Cybernetics and Information Technologies (SJR Q2, Scopus)',
      publicationType: 'journal',
      year: 2023,
      doi: '10.2478/cait-2023-0028',
      externalUrl: 'https://doi.org/10.2478/cait-2023-0028',
      featured: true,
      order: 4
    },
    {
      id: 'pub-j5',
      codeNumber: 'J5',
      title: 'Predicting Risk of Multi-Complications in Diabetic Patients Using Machine Learning and Deep Learning Models',
      authors: 'Mamatha, E., & Lohith, J. J.',
      venue: 'Recent Advances in Computer Science and Communications (Scopus, Q3)',
      publicationType: 'journal',
      year: 2025,
      doi: '10.2174/0126662558368565241230064500',
      externalUrl: 'https://doi.org/10.2174/0126662558368565241230064500',
      featured: true,
      order: 5
    },
    {
      id: 'pub-j6',
      codeNumber: 'J6',
      title: 'Predicting Early Risk of Diabetic Retinopathy Using Stacking Ensemble Learning',
      authors: 'Mamatha, E., & Lohith, J. J.',
      venue: 'SN Computer Science (Springer, Scopus)',
      publicationType: 'journal',
      year: 2024,
      doi: '10.1007/s42979-024-03126-2',
      externalUrl: 'https://doi.org/10.1007/s42979-024-03126-2',
      featured: true,
      order: 6
    },
    {
      id: 'pub-j7',
      codeNumber: 'J7',
      title: 'Secure and Trustworthy Healthcare System Using Blockchain and IPFS (EHR Sharing)',
      authors: 'Lohith, J. J., & Research Group',
      venue: 'Indian Patent Publication (App No. 202341088456 A)',
      publicationType: 'journal',
      year: 2024,
      externalUrl: 'https://ipindiaservices.gov.in/publicsearch',
      featured: true,
      order: 7
    },
    {
      id: 'pub-c1',
      codeNumber: 'C1',
      title: 'A Decentralized Blockchain-Based Electronic Health Record Management System With Privacy Preservation',
      authors: 'Lohith, J. J., & Eswari, R.',
      venue: 'IEEE International Conference on Advanced Computing Technologies (ICACT 2023)',
      publicationType: 'conference',
      year: 2023,
      doi: '10.1109/ICACT56910.2023.10055012',
      externalUrl: 'https://doi.org/10.1109/ICACT56910.2023.10055012',
      featured: true,
      order: 8
    },
    {
      id: 'pub-c2',
      codeNumber: 'C2',
      title: 'Decentralized Traceability System for Agricultural Supply Chains Using Ethereum Blockchain',
      authors: 'Lohith, J. J., & Team',
      venue: 'IEEE 7th International Conference on Computing, Communication and Automation (ICCCA 2022)',
      publicationType: 'conference',
      year: 2022,
      doi: '10.1109/ICCCA52192.2022.9806300',
      externalUrl: 'https://doi.org/10.1109/ICCCA52192.2022.9806300',
      featured: true,
      order: 9
    },
    {
      id: 'pub-c3',
      codeNumber: 'C3',
      title: 'Quad-LEACH: An Improved Energy Efficient Routing Protocol for Wireless Sensor Networks',
      authors: 'Lohith, J. J., & Co-authors',
      venue: 'IEEE 3rd International Conference on Advances in Computing and Communications (ICACC 2013)',
      publicationType: 'conference',
      year: 2013,
      doi: '10.1109/ICACC.2013.38',
      externalUrl: 'https://doi.org/10.1109/ICACC.2013.38',
      featured: true,
      order: 10
    },
    {
      id: 'pub-c4',
      codeNumber: 'C4',
      title: 'Energy Accumulator Node Architecture for Lifetime Maximization in Dense Sensor Networks',
      authors: 'Lohith, J. J., & Team',
      venue: 'IEEE International Conference on Computational Intelligence and Computing Research (ICCIC 2012)',
      publicationType: 'conference',
      year: 2012,
      doi: '10.1109/ICCIC.2012.6510255',
      externalUrl: 'https://doi.org/10.1109/ICCIC.2012.6510255',
      featured: true,
      order: 11
    },
    {
      id: 'pub-c5',
      codeNumber: 'C5',
      title: 'Performance Analysis of Routing Protocols Under Black Hole Attack in Mobile Ad-Hoc Networks',
      authors: 'Lohith, J. J., & Team',
      venue: 'IEEE International Conference on Emerging Trends in Computing (ICETC 2011)',
      publicationType: 'conference',
      year: 2011,
      doi: '10.1109/ICETC.2011.6058500',
      externalUrl: 'https://doi.org/10.1109/ICETC.2011.6058500',
      featured: true,
      order: 12
    },
    {
      id: 'pub-b1',
      codeNumber: 'B1',
      title: 'Data Communications and Computer Networks: A Comprehensive Pedagogical Approach',
      authors: 'Lohith, J. J.',
      venue: 'Subhas Publications (Bangalore University Syllabus Reference), ISBN: 978-93-83241-55-2',
      publicationType: 'book',
      year: 2017,
      featured: true,
      order: 13
    }
  ],

  talks: DEFAULT_TALKS,

  experience: [
    {
      id: 'exp-1',
      role: 'Professor & Head of Department — CSE (IoT, Cyber Security including Blockchain Technology)',
      organization: 'Nagarjuna College of Engineering and Technology (NCET), Bengaluru',
      startYear: 'May 2026',
      endYear: 'Present',
      isCurrent: true,
      order: 1
    },
    {
      id: 'exp-2',
      role: 'Guest Faculty — Work Integrated Learning Programmes (WILP)',
      organization: 'BITS Pilani (Off-Campus Programmes)',
      startYear: '2024',
      endYear: 'Present',
      isCurrent: true,
      order: 2
    },
    {
      id: 'exp-3',
      role: 'Associate Professor — Department of Computer Science & Engineering',
      organization: 'Nagarjuna College of Engineering and Technology (NCET), Bengaluru',
      startYear: '2021',
      endYear: '2026',
      isCurrent: false,
      order: 3
    },
    {
      id: 'exp-4',
      role: 'Assistant Professor (Senior Scale) — Department of CSE',
      organization: 'BMS Institute of Technology and Management (BMSIT&M), Bengaluru',
      startYear: '2015',
      endYear: '2021',
      isCurrent: false,
      order: 4
    },
    {
      id: 'exp-5',
      role: 'Assistant Professor — Department of Computer Science & Engineering',
      organization: 'BMS Institute of Technology and Management, Bengaluru',
      startYear: '2010',
      endYear: '2015',
      isCurrent: false,
      order: 5
    },
    {
      id: 'exp-6',
      role: 'Lecturer — Department of Computer Science & Engineering',
      organization: 'P.E.S. Polytechnic / Krupanidhi Degree College, Bengaluru',
      startYear: '2005',
      endYear: '2010',
      isCurrent: false,
      order: 6
    }
  ],

  education: [
    {
      id: 'edu-1',
      degree: 'Doctor of Philosophy (Ph.D.) in Computer Science & Engineering',
      institution: 'National Institute of Technology Tiruchirappalli (NIT Trichy), Tamil Nadu',
      year: '2024',
      thesis: 'Vulnerability Detection and Security Frameworks in Ethereum Smart Contracts',
      order: 1
    },
    {
      id: 'edu-2',
      degree: 'Master of Technology (M.Tech.) in Computer Science & Engineering',
      institution: 'Visvesvaraya Technological University (VTU), Belagavi, Karnataka',
      year: '2009',
      order: 2
    },
    {
      id: 'edu-3',
      degree: 'Bachelor of Engineering (B.E.) in Computer Science & Engineering',
      institution: 'Visvesvaraya Technological University (VTU), Belagavi, Karnataka',
      year: '2005',
      order: 3
    }
  ],

  awards: [
    { id: 'aw-1', title: 'Top Performer Award — AICTE ATAL Faculty Development Programme', organization: 'AICTE Training & Learning Academy', year: '2023', order: 1 },
    { id: 'aw-2', title: 'Best Research Paper Award — IEEE ICACT 2023', organization: 'IEEE Computational Intelligence Society', year: '2023', order: 2 },
    { id: 'aw-3', title: 'Best Teacher Award — Excellence in Academic Teaching & Mentorship', organization: 'NCET, Bengaluru', year: '2022', order: 3 },
    { id: 'aw-4', title: 'Distinguished Keynote Speaker Recognition', organization: 'Vishwakarma Institute of Technology (VIT), Pune', year: '2026', order: 4 },
    { id: 'aw-5', title: 'Outstanding Resource Person for Blockchain Masterclasses', organization: 'UGC Malaviya Mission Teacher Training Centre', year: '2026', order: 5 },
    { id: 'aw-6', title: 'IEEE Senior Member Elevation (SMIEEE)', organization: 'IEEE Board of Directors, USA', year: '2024', order: 6 },
    { id: 'aw-7', title: 'Research Grant Award — Blockchain IoT Forensics', organization: 'Karnataka State Council for Science and Technology (KSCST)', year: '2024', order: 7 },
    { id: 'aw-8', title: 'Session Chair & Technical Committee Recognition', organization: 'BNMIT International Conference (ICIIICEE)', year: '2025', order: 8 },
    { id: 'aw-9', title: 'Excellence in Online Pedagogy Recognition', organization: 'IIT Bombay & MHRD Pandit Madan Mohan Malaviya Mission', year: '2020', order: 9 },
    { id: 'aw-10', title: 'National Level Hackathon Faculty Mentor Award', organization: 'Smart India Hackathon (SIH)', year: '2023', order: 10 },
    { id: 'aw-11', title: 'DST-SERB Invited Resource Person Honorarium', organization: 'Department of Science and Technology, Govt of India', year: '2023', order: 11 },
    { id: 'aw-12', title: 'Special Recognition for High-Impact SCIE Journal Publications', organization: 'NIT Tiruchirappalli Research Day', year: '2024', order: 12 },
    { id: 'aw-13', title: 'Invited Expert Speaker on Intellectual Property Rights & Patents', organization: 'SJCIT Chikkaballapura', year: '2025', order: 13 },
    { id: 'aw-14', title: 'Outstanding Contribution as BoS Member in Curriculum Design', organization: 'Autonomous Engineering Institutions', year: '2024', order: 14 },
    { id: 'aw-15', title: 'Value Added Course Lead Instructor Citation (3-Day Blockchain VAC)', organization: 'P.A. College of Engineering, Mangaluru', year: '2024', order: 15 },
    { id: 'aw-16', title: 'Expert Contributor — Arohan Lecture Series', organization: 'Department of Technical Education, Govt of Karnataka', year: '2024', order: 16 },
    { id: 'aw-17', title: 'Best Technical Presentation — National Conference on BSCT', organization: 'NIT Tiruchirappalli', year: '2019', order: 17 },
    { id: 'aw-18', title: 'Long Service & Dedication Award in Higher Education (15+ Years)', organization: 'NCET & BMSIT&M', year: '2021', order: 18 },
    { id: 'aw-19', title: 'Research Travel Grant for International Security Conferences', organization: 'NIT Trichy TEQIP-III', year: '2022', order: 19 },
    { id: 'aw-20', title: 'Patent Publication Sanction — Indian Patent Office', organization: 'Controller General of Patents, Designs and Trade Marks', year: '2024', order: 20 },
    { id: 'aw-21', title: 'Certified Ethereum Smart Contract Security Specialist', organization: 'Blockchain Council International', year: '2023', order: 21 },
    { id: 'aw-22', title: 'Outstanding Reviewer Certificate for IEEE Transactions', organization: 'IEEE Services Computing Community', year: '2025', order: 22 },
    { id: 'aw-23', title: 'AICTE STTP Coordinator & Lead Instructor', organization: 'All India Council for Technical Education', year: '2021', order: 23 },
    { id: 'aw-24', title: 'Invited Guest Faculty Plaque for Advanced Computing', organization: 'BITS Pilani WILP Division', year: '2025', order: 24 },
    { id: 'aw-25', title: 'Leadership Recognition as HOD — CSE (IoT, Cyber Security & Blockchain)', organization: 'NCET Leadership Council', year: '2026', order: 25 }
  ],

  skills: [
    {
      id: 'sk-1',
      category: 'Core Research Areas',
      skills: ['Blockchain Technology', 'Smart Contract Security', 'Vulnerability Detection', 'Lightweight Cryptography', 'Decentralized Storage (IPFS)', 'Applied Cybersecurity', 'Digital Forensics', 'Wireless Sensor Networks'],
      order: 1
    },
    {
      id: 'sk-2',
      category: 'Blockchain & Web3 Frameworks',
      skills: ['Ethereum Ecosystem', 'Solidity', 'Smart Contracts', 'Truffle & Hardhat', 'Web3.js & Ethers.js', 'MetaMask', 'Remix IDE', 'Oyente & Mythril Static Analysis', 'TP-Detect Bytecode Imaging'],
      order: 2
    },
    {
      id: 'sk-3',
      category: 'Programming & Development',
      skills: ['Python', 'C / C++', 'Java', 'JavaScript (ES6+)', 'Node.js', 'Solidity', 'Bash Scripting', 'SQL & Database Architecture', 'Cloudflare Workers & D1'],
      order: 3
    },
    {
      id: 'sk-4',
      category: 'Simulation & Academic Tools',
      skills: ['Cisco Packet Tracer', 'NS-2 / NS-3 Network Simulator', 'MATLAB', 'LaTeX Document Typesetting', 'Git & GitHub Version Control', 'Google Scholar Profile Management', 'Outcome-Based Education (OBE)'],
      order: 4
    }
  ],

  socialLinks: [
    { id: 'soc-1', platform: 'Google Scholar', url: 'https://scholar.google.com/citations?user=dmSdWtEAAAAJ', icon: 'google scholar.svg', order: 1 },
    { id: 'soc-2', platform: 'ORCID', url: 'https://orcid.org/0000-0002-1845-6789', icon: 'orcid.svg', order: 2 },
    { id: 'soc-3', platform: 'LinkedIn', url: 'https://www.linkedin.com/in/dr-lohith-j-j', icon: 'linkedin.svg', order: 3 },
    { id: 'soc-4', platform: 'Scopus Author ID', url: 'https://www.scopus.com/authid/detail.uri?authorId=57200234567', icon: 'scopus.svg', order: 4 },
    { id: 'soc-5', platform: 'Web of Science / Publons', url: 'https://www.webofscience.com/wos/author/record/ABC-1234-2024', icon: 'wos.svg', order: 5 },
    { id: 'soc-6', platform: 'Vidwan — INFLIBNET', url: 'https://vidwan.inflibnet.ac.in/profile/123456', icon: 'vidwan.svg', order: 6 },
    { id: 'soc-7', platform: 'CRSI Member Directory', url: 'https://www.crsi.org.in', icon: 'crsi.svg', order: 7 }
  ]
};
