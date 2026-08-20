import React from 'react';
import { Save, CheckCircle2, RotateCcw } from 'lucide-react';

interface SaveBarProps {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset?: () => void;
  lastSaved?: string;
}

export const SaveBar: React.FC<SaveBarProps> = ({
  isDirty,
  isSaving,
  onSave,
  onReset,
  lastSaved
}) => {
  return (
    <div className="save-bar">
      <div className="save-bar-info">
        {isDirty ? (
          <span className="dirty-indicator">
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-warning)',
              animation: 'pulse-dot 1.5s ease-in-out infinite'
            }} />
            Unsaved changes
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem' }}>
            <CheckCircle2 size={15} color="var(--accent-success)" />
            {lastSaved ? `Saved at ${lastSaved}` : 'All changes saved'}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {onReset && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onReset}
            disabled={!isDirty || isSaving}
            style={{ padding: '7px 14px' }}
          >
            <RotateCcw size={14} />
            Discard
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSave}
          disabled={!isDirty || isSaving}
          style={{ padding: '7px 16px' }}
        >
          {isSaving ? (
            <>
              <div className="spinner" />
              Saving…
            </>
          ) : (
            <>
              <Save size={14} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};
