import { describe, it, expect } from 'vitest';
import { fallbackData } from '../scripts/data/fallback.js';

describe('Hydration & Data Source Synchronization Guarantee', () => {
  it('verifies fallbackData profile matches canonical static HTML identity', () => {
    expect(fallbackData.profile.name).toBe('Dr. Lohith J.J.');
    expect(fallbackData.profile.credential).toContain('Ph.D.');
    expect(fallbackData.profile.credential).toContain('NIT Tiruchirappalli');
    expect(fallbackData.profile.emailPrimary).toBe('lohithjj@gmail.com');
  });

  it('verifies fallbackData publications match the canonical publication titles in index.html', () => {
    const j1 = fallbackData.publications.find(p => p.codeNumber === 'J1');
    expect(j1).toBeDefined();
    expect(j1?.title).toBe('Predicting Diabetic Retinopathy and Nephropathy Complications Using Machine Learning Techniques');
    expect(j1?.year).toBe(2025);

    const j2 = fallbackData.publications.find(p => p.codeNumber === 'J2');
    expect(j2?.title).toBe('Enhancing Oyente: Four New Vulnerability Detections for Improved Smart Contract Security Analysis');
  });

  it('verifies fallbackData experience entries match canonical employment timeline', () => {
    expect(fallbackData.experience.length).toBe(6);
    expect(fallbackData.experience[0].role).toContain('Professor & Head');
    expect(fallbackData.experience[0].organization).toContain('Nagarjuna College of Engineering');
    expect(fallbackData.experience[2].organization).toBe('B.M.S. College of Engineering, Bengaluru');
  });

  it('verifies fallbackData education entries match canonical academic credentials', () => {
    expect(fallbackData.education.length).toBe(3);
    expect(fallbackData.education[0].degree).toContain('Ph.D.');
    expect(fallbackData.education[0].institution).toContain('National Institute of Technology');
  });

  it('verifies fallbackData socialLinks match canonical URLs in index.html for all platforms', () => {
    const scholar = fallbackData.socialLinks.find(s => s.platform === 'Google Scholar');
    expect(scholar?.url).toBe('https://scholar.google.com/citations?user=dmSdWtEAAAAJ&hl=en');

    const orcid = fallbackData.socialLinks.find(s => s.platform === 'ORCID');
    expect(orcid?.url).toBe('https://orcid.org/0000-0003-2117-2250');

    const scopus = fallbackData.socialLinks.find(s => s.platform.includes('Scopus'));
    expect(scopus?.url).toBe('https://www.scopus.com/authid/detail.uri?authorId=56857581400');

    const vidwan = fallbackData.socialLinks.find(s => s.platform.includes('Vidwan'));
    expect(vidwan?.url).toBe('https://vidwan.inflibnet.ac.in/profile/158563');

    const wos = fallbackData.socialLinks.find(s => s.platform.includes('Web of Science'));
    expect(wos?.url).toBe('https://www.webofscience.com/wos/author/record/E-2696-2017');

    const crsi = fallbackData.socialLinks.find(s => s.platform.includes('CRSI'));
    expect(crsi?.url).toBe('http://crsind.in/members/life-members/?q=L/0889');

    const email = fallbackData.socialLinks.find(s => s.platform === 'Email');
    expect(email?.url).toBe('mailto:lohithjj@gmail.com');

    const youtube = fallbackData.socialLinks.find(s => s.platform === 'YouTube');
    expect(youtube?.url).toBe('https://www.youtube.com/@shreyajj');
  });
});
