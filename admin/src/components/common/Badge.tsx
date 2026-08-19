import React from 'react';

interface BadgeProps {
  variant: 'success' | 'featured' | 'muted';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant, children }) => {
  return <span className={`badge badge-${variant}`}>{children}</span>;
};
