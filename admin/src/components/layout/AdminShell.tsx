import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AdminTab, AuthUser } from '../../types';

interface AdminShellProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  user?: AuthUser | null;
  onLogout?: () => void;
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  activeTab,
  onTabChange,
  user,
  onLogout,
  children
}) => {
  return (
    <div className="admin-layout">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
      <div className="admin-main">
        <TopBar activeTab={activeTab} user={user} onLogout={onLogout} />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
};
