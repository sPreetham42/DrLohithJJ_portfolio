import React from 'react';
import {
  User,
  GraduationCap,
  BookOpen,
  Mic,
  Briefcase,
  Award,
  Code2,
  Share2,
  BarChart3,
  HardDrive
} from 'lucide-react';
import { AdminTab } from '../../types';

interface SidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

interface NavItemDef {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'scholar', label: 'Scholar Stats', icon: BarChart3 },
  { id: 'publications', label: 'Publications', icon: BookOpen },
  { id: 'talks', label: 'Invited Talks', icon: Mic },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'awards', label: 'Awards & Grants', icon: Award },
  { id: 'skills', label: 'Technical Skills', icon: Code2 },
  { id: 'social', label: 'Academic Profiles', icon: Share2 },
  { id: 'assets', label: 'Assets & Media', icon: HardDrive }
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-title">Dr. Lohith J.J.</div>
        <div className="sidebar-logo-subtitle">Academic Admin</div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div>GitHub OAuth Protected</div>
        <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>D1 Native Edge Storage</div>
      </div>
    </aside>
  );
};
