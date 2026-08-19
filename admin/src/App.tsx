import React, { useState } from 'react';
import { AdminShell } from './components/layout/AdminShell';
import { AdminTab } from './types';
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
      adminEmail="lohithjj@gmail.com"
    >
      {renderActivePage()}
    </AdminShell>
  );
};
