import React from 'react';
import { Save, CheckCircle2 } from 'lucide-react';

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
          <span className="dirty-indicator">● Unsaved changes</span>
        ) : (
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="var(--accent-success)" />
            {lastSaved ? `All changes saved (${lastSaved})` : 'All changes saved'}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        {onReset && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onReset}
            disabled={!isDirty || isSaving}
          >
            Discard
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSave}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? (
            <>
              <div className="spinner" />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};
