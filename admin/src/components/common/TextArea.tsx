import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  isCode?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  hint,
  required,
  isCode,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`form-group ${className}`}>
      <label htmlFor={inputId} className="form-label">
        {label} {required && <span className="required">*</span>}
      </label>
      <textarea
        id={inputId}
        className={`form-textarea ${isCode ? 'code' : ''}`}
        required={required}
        {...props}
      />
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-hint" style={{ color: 'var(--accent-danger)' }}>{error}</span>}
    </div>
  );
};
