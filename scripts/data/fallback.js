// ================================================================
// CANONICAL STATIC FALLBACK DATA REPOSITORY
// Provides disaster/offline resilience when the Worker API is unreachable.
// Matches 100% of the verified current portfolio canonical state.
// ================================================================

import { DEFAULT_TALKS } from '../talks.js';

export const fallbackData = {
  profile: {
    name: 'Dr. Lohith J.J.',
    credential: 'Ph.D. · NIT Tiruchirappalli',
    designation: 'Professor & Head of Department — CSE (IoT & Cybersecurity including Blockchain Technology)',
    yearsExperience: 20,
    currentInstitution: 'Nagarjuna College of Engineering and Technology (NCET), Bengaluru',
    heroDescriptionLine1: 'Professor and Head of Department — CSE (IoT & Cybersecurity including Blockchain Technology) at Nagarjuna College of Engineering & Technology, Bengaluru, with over <strong>20 years</strong> of teaching and research experience in Computer Science and Engineering.',
    heroDescriptionLine2: 'Doctoral research from <strong>NIT Tiruchirappalli</strong> in Blockchain-Based Smart Contract Security. Resource person at <strong>60+ AICTE-sponsored FDPs and workshops</strong> across NITs and premier institutions. Guest Faculty at <strong>BITS WILP</strong> since 2011.',
    emailPrimary: 'lohithjj@gmail.com',
    emailSecondary: 'lohithjj@wilp.bits-pilani.ac.in',
    phone: '+91-9886745882',
    address: 'NCET, Bengaluru, Karnataka, India',
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
      title: 'Predicting Diabetic Retinopathy and Nephropathy Complications Using Machine Learning Techniques',
      authors: 'D. Manjunath, J. Lohith, S. S. Kumar, and A. Das',
      venue: 'IEEE Access (2025)',
      publicationType: 'journal',
      year: 2025,
      doi: '10.1109/ACCESS.10969779',
      externalUrl: 'https://ieeexplore.ieee.org/document/10969779',
      featured: true,
      order: 1
    },
    {
      id: 'pub-j2',
      codeNumber: 'J2',
      title: 'Enhancing Oyente: Four New Vulnerability Detections for Improved Smart Contract Security Analysis',
      authors: 'L. J.J. and K. Singh',
      venue: 'International Journal of Information Technology, vol. 16, no. 6, pp. 3389–3399 (2024)',
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
      title: 'Digital Forensic Framework for Smart Contract Vulnerabilities Using Ensemble Models',
      authors: 'L. J.J., K. Singh, and B. Chakravarthi',
      venue: 'Multimedia Tools and Applications, pp. 1–44 (2023)',
      publicationType: 'journal',
      year: 2023,
      doi: '10.1007/s11042-023-17308-3',
      externalUrl: 'https://doi.org/10.1007/s11042-023-17308-3',
      featured: true,
      order: 3
    },
    {
      id: 'pub-j4',
      codeNumber: 'J4',
      title: 'TP-Detect: Trigram-Pixel Based Vulnerability Detection for Ethereum Smart Contracts',
      authors: 'P. S. Lohith J J et al.',
      venue: 'Multimedia Tools and Applications, pp. 1–15 (2023)',
      publicationType: 'journal',
      year: 2023,
      doi: '10.1007/s11042-023-15042-4',
      externalUrl: 'https://doi.org/10.1007/s11042-023-15042-4',
      featured: true,
      order: 4
    },
    {
      id: 'pub-j5',
      codeNumber: 'J5',
      title: 'Smart Healthcare System with Light-Weighted Blockchain System and Deep Learning Techniques',
      authors: 'R. Singh, L. J. J. Mir, et al.',
      venue: 'Computational Intelligence and Neuroscience, vol. 2022 (2022)',
      publicationType: 'journal',
      year: 2022,
      doi: '10.1155/2022/1621258',
      externalUrl: 'https://doi.org/10.1155/2022/1621258',
      featured: false,
      order: 5
    },
    {
      id: 'pub-j6',
      codeNumber: 'J6',
      title: 'Survey on Cognitive Apprehensive Device',
      authors: 'L. J. J, V. Tyagi, P. Bajaj, R. Desai, and Pranoy',
      venue: 'JETIR, vol. 2016 (2016)',
      publicationType: 'journal',
      year: 2016,
      featured: false,
      order: 6
    },
    {
      id: 'pub-j7',
      codeNumber: 'J7',
      title: 'Role of Industry to Improve Outcome Based Education in Engineering',
      authors: 'L. J. J., Syedakram, Selvakumar S. et al.',
      venue: 'Journal of Engineering Education Transformations, vol. 2015 (2015)',
      publicationType: 'journal',
      year: 2015,
      externalUrl: 'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=dmSdWtEAAAAJ&citation_for_view=dmSdWtEAAAAJ:W7OEmFMy1HYC',
      featured: false,
      order: 7
    },
    {
      id: 'pub-c1',
      codeNumber: 'C1',
      title: 'Vulnerabilities in Smart Contracts: A Detailed Survey of Detection and Mitigation Methodologies',
      authors: 'N. K. Kumar, N. V. Honnungar, M. Sharwari Prakash, and J. J. Lohith',
      venue: 'ICETCS 2024, pp. 1–7 (2024)',
      publicationType: 'conference',
      year: 2024,
      doi: '10.1109/ICETCS61022.2024.10544155',
      externalUrl: 'https://doi.org/10.1109/ICETCS61022.2024.10544155',
      featured: true,
      order: 8
    },
    {
      id: 'pub-c2',
      codeNumber: 'C2',
      title: 'Enhancing Wireless Sensor Network Longevity and Security: A Quad-LEACH Approach',
      authors: 'J. J. Lohith, S. Shreya, and J. L. Hamsa Priya',
      venue: 'ICETCS 2024, pp. 1–6 (2024)',
      publicationType: 'conference',
      year: 2024,
      doi: '10.1109/ICETCS61022.2024.10543687',
      externalUrl: 'https://doi.org/10.1109/ICETCS61022.2024.10543687',
      featured: true,
      order: 9
    },
    {
      id: 'pub-c3',
      codeNumber: 'C3',
      title: 'Unlocking Efficiency in Agricultural Supply Chains: A Secure and Transparent Approach Through Blockchain Technology',
      authors: 'J. J. Lohith, S. Shreya, and J. L. Hamsa Priya',
      venue: 'ICETCS 2024, pp. 1–9 (2024)',
      publicationType: 'conference',
      year: 2024,
      doi: '10.1109/ICETCS61022.2024.10544311',
      externalUrl: 'https://doi.org/10.1109/ICETCS61022.2024.10544311',
      featured: true,
      order: 10
    },
    {
      id: 'pub-c4',
      codeNumber: 'C4',
      title: 'Managing the Supply Chain for Crops Directed from Agricultural Fields Using Blockchains',
      authors: 'G. Kannan, M. Pattnaik, G. Karthikeyan, B. E, P. J. Augustine, and L. J.J.',
      venue: 'ICEARS 2022, pp. 908–913 (2022)',
      publicationType: 'conference',
      year: 2022,
      doi: '10.1109/ICEARS53579.2022.9752088',
      externalUrl: 'https://doi.org/10.1109/ICEARS53579.2022.9752088',
      featured: true,
      order: 11
    },
    {
      id: 'pub-c5',
      codeNumber: 'C5',
      title: 'Secure Distributed Medical Record Storage Using Blockchain and Emergency Sharing Using Multi-Party Computation',
      authors: 'S. Parthasarathy, A. Harikrishnan, G. Narayanan, L. J.J., and K. Singh',
      venue: 'NTMS 2021, pp. 1–5 (2021)',
      publicationType: 'conference',
      year: 2021,
      doi: '10.1109/NTMS49979.2021.9432643',
      externalUrl: 'https://doi.org/10.1109/NTMS49979.2021.9432643',
      featured: true,
      order: 12
    },
    {
      id: 'pub-c6',
      codeNumber: 'C6',
      title: 'Intensifying the Lifetime of WSN Using a Centralized Energy Accumulator Node with RF Energy Transmission',
      authors: 'L. J.J. and B. C. S. B.',
      venue: 'IEEE IACC 2015, pp. 180–184 (2015)',
      publicationType: 'conference',
      year: 2015,
      doi: '10.1109/IADCC.2015.7154694',
      externalUrl: 'https://doi.org/10.1109/IADCC.2015.7154694',
      featured: false,
      order: 13
    }
  ],

  talks: DEFAULT_TALKS,

  experience: [
    {
      id: 'exp-1',
      role: 'Professor & Head, Dept. of CSE(IoT & CyberSecurity including Blockchain Technology)',
      organization: 'Nagarjuna College of Engineering & Technology, Bengaluru',
      startYear: 'May 2026',
      endYear: 'Present',
      isCurrent: true,
      order: 1
    },
    {
      id: 'exp-2',
      role: 'Professor & Head, Dept. of AI & ML',
      organization: 'Nagarjuna College of Engineering and Technology, Bengaluru',
      startYear: 'May 2024',
      endYear: 'May 2026',
      isCurrent: false,
      order: 2
    },
    {
      id: 'exp-3',
      role: 'Assistant Professor, Dept. of CSE',
      organization: 'B.M.S. College of Engineering, Bengaluru',
      startYear: 'May 2011',
      endYear: 'May 2024',
      isCurrent: false,
      order: 3
    },
    {
      id: 'exp-4',
      role: 'Senior Lecturer, Dept. of CSE',
      organization: 'Auden Technology and Management Academy',
      startYear: 'Aug 2009',
      endYear: 'May 2011',
      isCurrent: false,
      order: 4
    },
    {
      id: 'exp-5',
      role: 'Lecturer, Dept. of ISE',
      organization: 'A.P.S. College of Engineering',
      startYear: 'Aug 2007',
      endYear: 'Jul 2009',
      isCurrent: false,
      order: 5
    },
    {
      id: 'exp-6',
      role: 'Lecturer, Dept. of ISE',
      organization: 'Yellamma Dasappa Institute of Technology',
      startYear: 'Aug 2005',
      endYear: 'Jul 2006',
      isCurrent: false,
      order: 6
    }
  ],

  education: [
    {
      id: 'edu-1',
      degree: 'Ph.D., National Institute of Technology (NIT), Tiruchirappalli',
      institution: 'National Institute of Technology, Tiruchirappalli',
      year: '2024',
      thesis: 'Thesis: "Blockchain-Based Smart Contract Security: Frameworks for Vulnerability Detection and Credit Reporting"',
      order: 1
    },
    {
      id: 'edu-2',
      degree: 'M.Tech. — Computer Network and Engineering',
      institution: 'D.S.C.E., V.T.U. — 77%',
      year: '2009',
      order: 2
    },
    {
      id: 'edu-3',
      degree: 'B.E. — Computer Science and Engineering',
      institution: 'B.N.M.I.T., V.T.U. — 68%',
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

  get skillCategories() {
    return this.skills;
  },

  socialLinks: [
    { id: 'soc-1', platform: 'LinkedIn', url: 'https://www.linkedin.com/in/dr-lohith-j-j-2680aa50/', icon: 'linkedin.svg', order: 1 },
    { id: 'soc-2', platform: 'Google Scholar', url: 'https://scholar.google.com/citations?user=dmSdWtEAAAAJ&hl=en', icon: 'google scholar.svg', order: 2 },
    { id: 'soc-3', platform: 'ORCID', url: 'https://orcid.org/0000-0003-2117-2250', icon: 'orcid.svg', order: 3 },
    { id: 'soc-4', platform: 'Scopus Author ID', url: 'https://www.scopus.com/authid/detail.uri?authorId=56857581400', icon: 'scopus.svg', order: 4 },
    { id: 'soc-5', platform: 'Vidwan Profile', url: 'https://vidwan.inflibnet.ac.in/profile/158563', icon: 'vidwan.svg', order: 5 },
    { id: 'soc-6', platform: 'Web of Science', url: 'https://www.webofscience.com/wos/author/record/E-2696-2017', icon: 'wos.svg', order: 6 },
    { id: 'soc-7', platform: 'CRSI Member Directory', url: 'http://crsind.in/members/life-members/?q=L/0889', icon: 'crsi.svg', order: 7 },
    { id: 'soc-8', platform: 'Email', url: 'mailto:lohithjj@gmail.com', icon: 'gmail.svg', order: 8 },
    { id: 'soc-9', platform: 'YouTube', url: 'https://www.youtube.com/@shreyajj', icon: 'youtube.svg', order: 9 }
  ],

  patents: [
    {
      id: 'pat-1',
      title: 'Intelli-Port: An Autonomous Multi-Functional Service Robot with Intelligent Navigation, Human Following, and Environmental Mapping',
      domain: 'Electronics',
      publicationDate: '2026-07-31',
      applicationNumber: '202641091778',
      order: 1
    },
    {
      id: 'pat-2',
      title: 'AI-Enabled Robotic Wardrobe System for Automated Garment Care',
      domain: 'Electronics',
      publicationDate: '2026-02-13',
      applicationNumber: '202641009664',
      order: 2
    }
  ],

  researchScholars: [
    {
      id: 'rs-1',
      name: 'Ms. Shyla Moses',
      scholarId: '251589001019',
      badge: 'Co-guided',
      affiliation: 'MAHE Bangalore',
      guidance: 'Co-guided by Dr. Lohith J.J.',
      order: 1
    },
    {
      id: 'rs-2',
      name: 'Ms. Bhavana Subhash Gujarkar',
      scholarId: '252589001045',
      badge: 'Co-guided',
      affiliation: 'MAHE Bangalore',
      guidance: 'Co-guided by Dr. Lohith J.J.',
      order: 2
    }
  ]
};
