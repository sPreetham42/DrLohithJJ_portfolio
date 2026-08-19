import React, { useState, useEffect } from 'react';
import { Info, BarChart2 } from 'lucide-react';
import { adminApi, ApiClientError } from '../api/client';
import { ScholarStatsAdminRecord } from '../types';
import { FormSection } from '../components/common/FormSection';
import { TextField } from '../components/common/TextField';
import { SaveBar } from '../components/common/SaveBar';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { VersionConflictDialog } from '../components/common/VersionConflictDialog';

export const ScholarStatsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState<ScholarStatsAdminRecord | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [initialData, setInitialData] = useState<any>({});
  const [isDirty, setIsDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | undefined>(undefined);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await adminApi.getScholarStats();
      setStats(data);

      const parsedForm = {
        citations: data.citations,
        hIndex: data.h_index,
        i10Index: data.i10_index,
        sciePapersCount: data.scie_papers_count,
        ieeeConferencesCount: data.ieee_conferences_count,
        lastUpdated: data.last_updated,
        source: data.source
      };

      setFormData(parsedForm);
      setInitialData(parsedForm);
      setIsDirty(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load scholar metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleChange = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    setIsDirty(JSON.stringify(updated) !== JSON.stringify(initialData));
  };

  const handleSave = async () => {
    if (!stats) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const payload = {
        citations: Number(formData.citations),
        hIndex: Number(formData.hIndex),
        i10Index: Number(formData.i10Index),
        sciePapersCount: Number(formData.sciePapersCount),
        ieeeConferencesCount: Number(formData.ieeeConferencesCount),
        lastUpdated: new Date().toISOString(),
        source: formData.source || 'google_scholar'
      };

      const updated = await adminApi.updateScholarStats(payload, stats.version);
      setStats(updated);
      setInitialData(formData);
      setIsDirty(false);
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to save scholar metrics');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(initialData);
    setIsDirty(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <div className="spinner" style={{ width: '32px', height: '32px' }} />
      </div>
    );
  }

  return (
    <div>
      <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

      {/* Operational Disclaimer */}
      <div className="banner banner-warning">
        <Info size={18} style={{ flexShrink: 0 }} />
        <div>
          <strong>Automated Google Scholar Sync Active:</strong> Metrics are automatically synchronized daily from Google Scholar via GitHub Actions automation. Manual changes here act as an administrative override.
        </div>
      </div>

      <FormSection
        title="Google Scholar & Academic Impact Metrics"
        description="Publicly displayed citation, h-index, and publication indices"
      >
        <div className="form-grid">
          <TextField
            label="Total Citations"
            type="number"
            value={formData.citations || 0}
            onChange={(e) => handleChange('citations', e.target.value)}
            required
          />
          <TextField
            label="h-Index"
            type="number"
            value={formData.hIndex || 0}
            onChange={(e) => handleChange('hIndex', e.target.value)}
            required
          />
          <TextField
            label="i10-Index"
            type="number"
            value={formData.i10Index || 0}
            onChange={(e) => handleChange('i10Index', e.target.value)}
            required
          />
          <TextField
            label="SCIE / Scopus Indexed Papers Count"
            type="number"
            value={formData.sciePapersCount || 0}
            onChange={(e) => handleChange('sciePapersCount', e.target.value)}
            required
          />
          <TextField
            label="IEEE / International Conferences Count"
            type="number"
            value={formData.ieeeConferencesCount || 0}
            onChange={(e) => handleChange('ieeeConferencesCount', e.target.value)}
            required
          />
          <TextField
            label="Source Identifier"
            value={formData.source || 'google_scholar'}
            onChange={(e) => handleChange('source', e.target.value)}
            required
          />
        </div>
      </FormSection>

      <SaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
        lastSaved={lastSaved}
      />

      <VersionConflictDialog
        isOpen={showConflictDialog}
        onReload={() => {
          setShowConflictDialog(false);
          fetchStats();
        }}
        onCancel={() => setShowConflictDialog(false)}
      />
    </div>
  );
};
