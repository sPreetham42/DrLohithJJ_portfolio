import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, LogOut } from 'lucide-react';
import { AdminTab, AuthUser } from '../../types';
import { authApi } from '../../api/client';

interface TopBarProps {
  activeTab: AdminTab;
  user?: AuthUser | null;
  onLogout?: () => void;
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

export const TopBar: React.FC<TopBarProps> = ({ activeTab, user, onLogout }) => {
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

  const displayName = user?.name || user?.login || user?.email || 'Authorized Admin';
  const displaySub = user?.login ? `@${user.login}` : (user?.email || 'Admin Session');

  return (
    <header className="admin-topbar">
      <h1 className="topbar-title">{TAB_TITLES[activeTab] || 'Admin Dashboard'}</h1>

      <div className="topbar-identity">
        <a
          href="https://drlohithjj.in"
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

        <div className="identity-badge" title={`Authenticated as ${displayName} (${displaySub})`}>
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                objectFit: 'cover'
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
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          title="Sign out of current admin session"
          id="btn-logout"
        >
          <LogOut size={14} />
          <span>{loggingOut ? 'Signing out...' : 'Logout'}</span>
        </button>
      </div>
    </header>
  );
};
