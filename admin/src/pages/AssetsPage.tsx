import React, { useState } from 'react';
import { HardDrive, CheckCircle2, Shield } from 'lucide-react';
import { FormSection } from '../components/common/FormSection';
import { AssetUploader } from '../components/common/AssetUploader';

export const AssetsPage: React.FC = () => {
  const [uploadedAssets, setUploadedAssets] = useState<Array<{ name: string; path: string; time: string }>>([
    { name: 'Dr Lohith J J.jpeg', path: 'assets/Dr Lohith J J.jpeg', time: 'Initial Canonical Migration' }
  ]);

  const handleNewAsset = (path: string) => {
    const filename = path.split('/').pop() || path;
    setUploadedAssets((prev) => [
      { name: filename, path, time: new Date().toLocaleTimeString() },
      ...prev
    ]);
  };

  return (
    <div>
      <FormSection
        title="Cloudflare R2 Direct Upload Architecture"
        description="Presigned URL boundary for zero-overhead direct object storage uploads"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              lineHeight: 1.6
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '4px' }}>
              <Shield size={16} /> Edge-Enforced Security Flow
            </div>
            <ol style={{ paddingLeft: '20px', color: 'var(--text-muted)' }}>
              <li>Administrator selects document or image in Admin Dashboard.</li>
              <li>Browser requests short-lived (900s) presigned upload authorization from <code>POST /api/v1/admin/assets/presigned-url</code>.</li>
              <li>Browser transmits binary directly to Cloudflare R2 bucket via HTTP PUT (zero Worker CPU/RAM memory overhead).</li>
              <li>D1 stores lightweight relative path and metadata reference.</li>
            </ol>
          </div>

          <div style={{ marginTop: '8px' }}>
            <AssetUploader
              label="Upload Asset to R2 Bucket"
              currentAssetPath={null}
              onAssetUploaded={handleNewAsset}
              allowedExtensions={['.jpg', '.jpeg', '.png', '.pdf']}
              hint="Upload high-res portrait, research preprint PDF, or award certificate"
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Active Storage Assets Inventory"
        description="List of verified media objects available for portfolio association"
      >
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>File Identifier</th>
                <th>Resolved Storage Path</th>
                <th style={{ width: '180px' }}>Registered At</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {uploadedAssets.map((ast, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{ast.name}</td>
                  <td>
                    <code style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                      {ast.path}
                    </code>
                  </td>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{ast.time}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--accent-success)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> Ready
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormSection>
    </div>
  );
};
