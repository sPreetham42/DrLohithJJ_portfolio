import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Contact Form & Formspree Integration Guarantee', () => {
  const indexPath = path.resolve(process.cwd(), 'index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf-8');

  it('configures contact form with canonical active Formspree endpoint xrpzqwwp', () => {
    expect(indexHtml).toContain('id="contact-form"');
    expect(indexHtml).toContain('action="https://formspree.io/f/xrpzqwwp"');
    expect(indexHtml).toContain('method="POST"');
  });

  it('contains required input semantic fields (name, email, subject, message)', () => {
    expect(indexHtml).toContain('name="name"');
    expect(indexHtml).toContain('name="email"');
    expect(indexHtml).toContain('name="subject"');
    expect(indexHtml).toContain('name="message"');
    expect(indexHtml).toContain('name="_gotcha"');
  });

  it('verifies active Formspree endpoint returns HTTP 200 ok for valid submissions', async () => {
    const res = await fetch('https://formspree.io/f/xrpzqwwp', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Automated Vitest Regression Runner',
        email: 'test-runner@ncet.edu.in',
        subject: 'General Academic Inquiry',
        message: 'Automated verification check for contact form endpoint.'
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});
