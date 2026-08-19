import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AdminTab } from '../../types';

interface AdminShellProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  adminEmail?: string;
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  activeTab,
  onTabChange,
  adminEmail,
  children
}) => {
  return (
    <div className="admin-layout">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
      <div className="admin-main">
        <TopBar activeTab={activeTab} adminEmail={adminEmail} />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
};
