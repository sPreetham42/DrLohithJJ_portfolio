import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, LogOut, Menu } from 'lucide-react';
import { AdminTab, AuthUser } from '../../types';
import { authApi } from '../../api/client';

interface TopBarProps {
  activeTab: AdminTab;
  user?: AuthUser | null;
  onLogout?: () => void;
  onMenuToggle?: () => void;
}

const TAB_TITLES: Record<AdminTab, string> = {
  profile: 'Academic Profile',
  scholar: 'Scholar Metrics',
  publications: 'Publications',
  patents: 'Patents',
  scholars: 'Research Scholars',
  talks: 'Invited Talks',
  experience: 'Experience',
  education: 'Education',
  awards: 'Awards & Grants',
  skills: 'Technical Skills',
  social: 'Academic Profiles',
  assets: 'Assets & Media'
};

const TAB_DESCRIPTIONS: Record<AdminTab, string> = {
  profile: 'Manage identity, contact details, and bio content',
  scholar: 'Review and override citation metrics',
  publications: 'Journals, conferences, and book chapters',
  patents: 'Published Indian and international patents',
  scholars: 'Co-guided research scholars and candidates',
  talks: 'Keynotes, invited lectures, and guest talks',
  experience: 'Academic and professional positions',
  education: 'Degrees and educational qualifications',
  awards: 'Honors, grants, and recognitions',
  skills: 'Technical skills and competency categories',
  social: 'Links to academic and professional profiles',
  assets: 'Manage uploaded media and documents'
};

export const TopBar: React.FC<TopBarProps> = ({ activeTab, user, onLogout, onMenuToggle }) => {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      if (onLogout) {
        onLogout();
      } else {
        window.location.href = '/dashboard';
      }
    }
  };

  const displayName = user?.name || user?.login || user?.email || 'Admin';

  return (
    <header className="admin-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onMenuToggle}
          title="Toggle navigation"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="topbar-title">{TAB_TITLES[activeTab] || 'Dashboard'}</h1>
          <p style={{
            fontSize: '0.725rem',
            color: 'var(--text-dim)',
            margin: 0,
            lineHeight: 1.3
          }}>
            {TAB_DESCRIPTIONS[activeTab]}
          </p>
        </div>
      </div>

      <div className="topbar-identity">
        <a
          href="https://drlohithjj.in"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost"
          style={{ fontSize: '0.775rem', textDecoration: 'none', gap: '5px' }}
        >
          <span>Live Site</span>
          <ExternalLink size={13} />
        </a>

        <div className="identity-badge" title={`Signed in as ${displayName}`}>
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid var(--border-primary)'
              }}
            />
          ) : (
            <ShieldCheck size={14} color="var(--accent-success)" />
          )}
          <span style={{ fontWeight: 500 }}>{displayName}</span>
          <div className="identity-dot" />
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="btn btn-secondary"
          style={{ padding: '5px 12px', fontSize: '0.775rem' }}
          title="Sign out"
          id="btn-logout"
        >
          <LogOut size={14} />
          <span>{loggingOut ? 'Signing out…' : 'Logout'}</span>
        </button>
      </div>
    </header>
  );
};
