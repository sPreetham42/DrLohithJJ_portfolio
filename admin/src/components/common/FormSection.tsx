import React from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, description, children, action, icon }) => {
  return (
    <div className="admin-card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          {icon && (
            <div style={{
              color: 'var(--accent-primary)',
              marginTop: '1px',
              opacity: 0.7,
              flexShrink: 0
            }}>
              {icon}
            </div>
          )}
          <div>
            <h3 className="card-title">{title}</h3>
            {description && <p className="card-description">{description}</p>}
          </div>
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      {children}
    </div>
  );
};
