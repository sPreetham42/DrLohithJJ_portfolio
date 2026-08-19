import React from 'react';
import { ShieldCheck, ExternalLink, LogOut } from 'lucide-react';
import { AdminTab } from '../../types';

interface TopBarProps {
  activeTab: AdminTab;
  adminEmail?: string;
}

const TAB_TITLES: Record<AdminTab, string> = {
  profile: 'Academic Profile & Identity',
  scholar: 'Google Scholar Metrics Override',
  publications: 'Publications Management',
  talks: 'Invited Talks & Keynotes',
  experience: 'Academic & Professional Experience',
  education: 'Degrees & Educational Qualifications',
  awards: 'Honors, Awards & Grants',
  skills: 'Technical Skills & Competencies',
  social: 'Academic & Professional Profiles',
  assets: 'Media Assets & Cloudflare R2'
};

export const TopBar: React.FC<TopBarProps> = ({ activeTab, adminEmail = 'lohithjj@gmail.com' }) => {
  const handleLogout = () => {
    // Cloudflare Access logout URL
    window.location.href = '/cdn-cgi/access/logout';
  };

  return (
    <header className="admin-topbar">
      <h1 className="topbar-title">{TAB_TITLES[activeTab] || 'Admin Dashboard'}</h1>

      <div className="topbar-identity">
        <a
          href="https://drlohithjj.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            textDecoration: 'none'
          }}
        >
          <span>Live Site</span>
          <ExternalLink size={14} />
        </a>

        <div className="identity-badge">
          <ShieldCheck size={14} color="var(--accent-success)" />
          <span>{adminEmail}</span>
          <div className="identity-dot" />
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          title="Exit Cloudflare Access session"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
