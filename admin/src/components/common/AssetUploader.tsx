import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, Info } from 'lucide-react';
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
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setInfoMessage(null);
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

      // 2. Direct browser upload to R2 storage (when R2 binding is active)
      if (presign && (presign as any).uploadUrl) {
        const uploadRes = await fetch((presign as any).uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream'
          },
          body: file
        });

        if (!uploadRes.ok) {
          throw new Error(`R2 direct upload failed with status ${uploadRes.status}`);
        }

        const uploadedPath = `assets/${(presign as any).uploadKey}`;
        onAssetUploaded(uploadedPath);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        // R2 binding is deferred in current environment
        setInfoMessage('Cloudflare R2 bucket binding is currently deferred. Asset paths are referenced from repository static assets.');
      }
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        if (err.status === 501) {
          setInfoMessage('Cloudflare R2 bucket binding is currently deferred in wrangler.toml. Static assets in repository /assets/ are active.');
        } else {
          setError(`Upload request failed: ${err.message}`);
        }
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
                Click to select a file or drag &amp; drop
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
          <CheckCircle2 size={14} /> Asset uploaded and linked!
        </div>
      )}

      {infoMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '0.8rem', marginTop: '6px' }}>
          <Info size={14} /> {infoMessage}
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
