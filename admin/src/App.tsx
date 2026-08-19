import React, { useState, useEffect } from 'react';
import { AdminShell } from './components/layout/AdminShell';
import { LoginPage } from './components/auth/LoginPage';
import { AdminTab, AuthUser } from './types';
import { authApi, onAuthExpired } from './api/client';
import { ProfilePage } from './pages/ProfilePage';
import { PublicationsPage } from './pages/PublicationsPage';
import { ScholarStatsPage } from './pages/ScholarStatsPage';
import { TalksPage } from './pages/TalksPage';
import { ExperiencePage } from './pages/ExperiencePage';
import { EducationPage } from './pages/EducationPage';
import { AwardsPage } from './pages/AwardsPage';
import { SkillsPage } from './pages/SkillsPage';
import { SocialLinksPage } from './pages/SocialLinksPage';
import { AssetsPage } from './pages/AssetsPage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('profile');
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const data = await authApi.getMe();
        if (isMounted) {
          if (data.authenticated && data.user) {
            setUser(data.user);
            setAuthStatus('authenticated');
          } else {
            setUser(null);
            setAuthStatus('unauthenticated');
          }
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
          setAuthStatus('unauthenticated');
        }
      }
    }

    checkAuth();

    const unsubscribe = onAuthExpired(() => {
      if (isMounted) {
        setUser(null);
        setAuthStatus('unauthenticated');
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    setUser(null);
    setAuthStatus('unauthenticated');
  };

  if (authStatus === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary, #0f172a)',
          color: 'var(--text-muted, #94a3b8)',
          gap: '16px',
          fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)'
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
        <div style={{ fontSize: '0.9rem' }}>Verifying Administrator Session...</div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return <LoginPage />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfilePage />;
      case 'scholar':
        return <ScholarStatsPage />;
      case 'publications':
        return <PublicationsPage />;
      case 'talks':
        return <TalksPage />;
      case 'experience':
        return <ExperiencePage />;
      case 'education':
        return <EducationPage />;
      case 'awards':
        return <AwardsPage />;
      case 'skills':
        return <SkillsPage />;
      case 'social':
        return <SocialLinksPage />;
      case 'assets':
        return <AssetsPage />;
      default:
        return <ProfilePage />;
    }
  };

  return (
    <AdminShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      user={user}
      onLogout={handleLogout}
    >
      {renderActivePage()}
    </AdminShell>
  );
};
