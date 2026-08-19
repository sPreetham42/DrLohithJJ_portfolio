import React from 'react';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  description,
  disabled
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div>
        <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-main)' }}>{label}</div>
        {description && (
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {description}
          </div>
        )}
      </div>
      <div
        style={{
          width: '40px',
          height: '22px',
          backgroundColor: checked ? 'var(--accent-primary)' : 'var(--border-subtle)',
          borderRadius: '9999px',
          position: 'relative',
          transition: 'background-color 0.2s ease',
          opacity: disabled ? 0.6 : 1
        }}
      >
        <div
          style={{
            width: '16px',
            height: '16px',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            position: 'absolute',
            top: '3px',
            left: checked ? '21px' : '3px',
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
          }}
        />
      </div>
    </div>
  );
};
