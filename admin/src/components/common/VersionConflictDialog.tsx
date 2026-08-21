import React, { useEffect } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface VersionConflictDialogProps {
  isOpen: boolean;
  onReload: () => void;
  onCancel: () => void;
}

export const VersionConflictDialog: React.FC<VersionConflictDialogProps> = ({
  isOpen,
  onReload,
  onCancel
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="modal-content"
        style={{ maxWidth: '480px' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="conflict-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-warning)'
            }}
          >
            <AlertCircle size={24} />
          </div>
          <h3 id="conflict-dialog-title" className="modal-title">
            Concurrency Conflict (HTTP 409)
          </h3>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>
          This record was modified by another administrator since you loaded it. To protect data integrity, your changes cannot overwrite the newer version.
        </p>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.825rem' }}>
          Clicking <strong>Reload Latest Version</strong> will fetch the current database state so you can reapply your updates.
        </p>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Keep My Edits (Review)
          </button>
          <button type="button" className="btn btn-primary" onClick={onReload}>
            <RefreshCw size={16} />
            Reload Latest Version
          </button>
        </div>
      </div>
    </div>
  );
};
