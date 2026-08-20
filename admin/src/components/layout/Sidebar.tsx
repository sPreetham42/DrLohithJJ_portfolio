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
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItemDef {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
}

interface NavSection {
  label: string;
  items: NavItemDef[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'scholar', label: 'Scholar Metrics', icon: BarChart3 }
    ]
  },
  {
    label: 'Academic Content',
    items: [
      { id: 'publications', label: 'Publications', icon: BookOpen },
      { id: 'talks', label: 'Invited Talks', icon: Mic },
      { id: 'experience', label: 'Experience', icon: Briefcase },
      { id: 'education', label: 'Education', icon: GraduationCap },
      { id: 'awards', label: 'Awards & Grants', icon: Award }
    ]
  },
  {
    label: 'Configuration',
    items: [
      { id: 'skills', label: 'Technical Skills', icon: Code2 },
      { id: 'social', label: 'Academic Profiles', icon: Share2 },
      { id: 'assets', label: 'Assets & Media', icon: HardDrive }
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onClose }) => {
  const handleNavClick = (tab: AdminTab) => {
    onTabChange(tab);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
          onClick={onClose}
        />
      )}

      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-title">Dr. Lohith J.J.</div>
          <div className="sidebar-logo-subtitle">Academic Portfolio Admin</div>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <React.Fragment key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-success)',
              flexShrink: 0
            }} />
            <span>Cloudflare Edge • D1</span>
          </div>
        </div>
      </aside>
    </>
  );
};
