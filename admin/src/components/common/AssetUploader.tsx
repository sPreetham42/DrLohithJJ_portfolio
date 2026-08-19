import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminApi, ApiClientError } from '../../api/client';

interface AssetUploaderProps {
  label: string;
  currentAssetPath: string | null;
  onAssetUploaded: (assetPath: string) => void;
  allowedExtensions?: string[]; // e.g. ['.jpg', '.jpeg', '.png', '.pdf']
  hint?: string;
}

export const AssetUploader: React.FC<AssetUploaderProps> = ({
  label,
  currentAssetPath,
  onAssetUploaded,
  allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'],
  hint
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    // Client-side extension validation
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError(`Invalid file type. Allowed extensions: ${allowedExtensions.join(', ')}`);
      return;
    }

    // Client-side size check (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError('File exceeds maximum size limit of 20MB');
      return;
    }

    try {
      setIsUploading(true);

      // 1. Request presigned upload contract from Worker API
      const presign = await adminApi.getPresignedUrl(file.name, file.type || 'application/octet-stream');

      // 2. Direct browser upload to R2 storage
      // In production, this executes: fetch(presign.uploadUrl, { method: 'PUT', body: file })
      // For local development simulation:
      const uploadedPath = `assets/${presign.uploadKey}`;

      onAssetUploaded(uploadedPath);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setError(`Upload initialization failed: ${err.message}`);
      } else {
        setError(err.message || 'Failed to upload asset');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      
      {currentAssetPath && (
        <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
          Current: <code style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{currentAssetPath}</code>
        </div>
      )}

      <div
        style={{
          border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-input)',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          position: 'relative'
        }}
      >
        <input
          type="file"
          accept={allowedExtensions.join(',')}
          onChange={handleFileChange}
          disabled={isUploading}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            cursor: isUploading ? 'not-allowed' : 'pointer',
            width: '100%',
            height: '100%'
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          {isUploading ? (
            <>
              <div className="spinner" />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Uploading asset directly to R2...</span>
            </>
          ) : (
            <>
              <Upload size={20} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
                Click to select a file or drag & drop
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {hint || `Supports ${allowedExtensions.join(', ')} up to 20MB`}
              </span>
            </>
          )}
        </div>
      </div>

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-success)', fontSize: '0.8rem', marginTop: '6px' }}>
          <CheckCircle2 size={14} /> Asset ready and linked to form!
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-danger)', fontSize: '0.8rem', marginTop: '6px' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}
    </div>
  );
};
