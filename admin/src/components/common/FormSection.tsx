import React from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, description, children, action }) => {
  return (
    <div className="admin-card">
      <div className="card-header">
        <div>
          <h3 className="card-title">{title}</h3>
          {description && <p className="card-description">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
};
