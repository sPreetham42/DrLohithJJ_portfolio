import React, { useState, useEffect } from 'react';
import { adminApi, ApiClientError } from '../api/client';
import { ProfileAdminRecord } from '../types';
import { FormSection } from '../components/common/FormSection';
import { TextField } from '../components/common/TextField';
import { TextArea } from '../components/common/TextArea';
import { SaveBar } from '../components/common/SaveBar';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { VersionConflictDialog } from '../components/common/VersionConflictDialog';
import { AssetUploader } from '../components/common/AssetUploader';

export const ProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileAdminRecord | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [initialData, setInitialData] = useState<any>({});
  const [isDirty, setIsDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | undefined>(undefined);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await adminApi.getProfile();
      setProfile(data);

      const parsedForm = {
        name: data.name,
        credential: data.credential || '',
        designation: data.designation,
        yearsExperience: data.years_experience,
        currentInstitution: data.current_institution,
        heroDescriptionLine1: data.hero_description_line1,
        heroDescriptionLine2: data.hero_description_line2,
        emailPrimary: data.email_primary,
        emailSecondary: data.email_secondary || '',
        phone: data.phone,
        address: data.address,
        photoAsset: data.photo_asset_id || '',
        additionalRoles: JSON.parse(data.additional_roles_json || '[]').join('\n'),
        professionalMemberships: JSON.parse(data.professional_memberships_json || '[]').join('\n')
      };

      setFormData(parsedForm);
      setInitialData(parsedForm);
      setIsDirty(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    setIsDirty(JSON.stringify(updated) !== JSON.stringify(initialData));
  };

  const handleSave = async () => {
    if (!profile) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const payload = {
        name: formData.name,
        credential: formData.credential || null,
        designation: formData.designation,
        yearsExperience: Number(formData.yearsExperience),
        currentInstitution: formData.currentInstitution,
        heroDescriptionLine1: formData.heroDescriptionLine1,
        heroDescriptionLine2: formData.heroDescriptionLine2,
        emailPrimary: formData.emailPrimary,
        emailSecondary: formData.emailSecondary || null,
        phone: formData.phone,
        address: formData.address,
        photoAsset: formData.photoAsset || null,
        additionalRoles: formData.additionalRoles
          ? formData.additionalRoles.split('\n').map((s: string) => s.trim()).filter(Boolean)
          : [],
        professionalMemberships: formData.professionalMemberships
          ? formData.professionalMemberships.split('\n').map((s: string) => s.trim()).filter(Boolean)
          : []
      };

      const updated = await adminApi.updateProfile(payload, profile.version);
      setProfile(updated);
      setInitialData(formData);
      setIsDirty(false);
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to save profile changes');
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

      {/* 1. Academic Identity */}
      <FormSection
        title="Academic Identity"
        description="Professor name, credentials, current designation, and primary institution"
      >
        <div className="form-grid">
          <TextField
            label="Full Name"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
          <TextField
            label="Post-Nominal Credential"
            value={formData.credential || ''}
            onChange={(e) => handleChange('credential', e.target.value)}
            hint="e.g. Ph.D. — NIT Trichy"
          />
          <div className="form-group col-span-2">
            <TextField
              label="Academic Designation & Department"
              value={formData.designation || ''}
              onChange={(e) => handleChange('designation', e.target.value)}
              required
            />
          </div>
          <TextField
            label="Current Institution"
            value={formData.currentInstitution || ''}
            onChange={(e) => handleChange('currentInstitution', e.target.value)}
            required
          />
          <TextField
            label="Years of Experience"
            type="number"
            value={formData.yearsExperience || 0}
            onChange={(e) => handleChange('yearsExperience', e.target.value)}
            required
          />
        </div>
      </FormSection>

      {/* 2. Hero Content */}
      <FormSection
        title="Hero Content & Academic Bio"
        description="Public introduction lines displayed on the homepage hero"
      >
        <div className="form-grid full">
          <TextArea
            label="Hero Description (Line 1)"
            value={formData.heroDescriptionLine1 || ''}
            onChange={(e) => handleChange('heroDescriptionLine1', e.target.value)}
            hint="Supports existing inline HTML tags (e.g. <strong>20 years</strong>). Preserved safely without stripping."
            required
          />
          <TextArea
            label="Hero Description (Line 2)"
            value={formData.heroDescriptionLine2 || ''}
            onChange={(e) => handleChange('heroDescriptionLine2', e.target.value)}
            required
          />
        </div>
      </FormSection>

      {/* 3. Contact & Office Location */}
      <FormSection
        title="Contact & Office Location"
        description="Verified institutional contact details"
      >
        <div className="form-grid">
          <TextField
            label="Primary Institutional Email"
            type="email"
            value={formData.emailPrimary || ''}
            onChange={(e) => handleChange('emailPrimary', e.target.value)}
            required
          />
          <TextField
            label="Secondary Email (Optional)"
            type="email"
            value={formData.emailSecondary || ''}
            onChange={(e) => handleChange('emailSecondary', e.target.value)}
          />
          <TextField
            label="Official Phone / Contact"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            required
          />
          <TextField
            label="Campus Address / Office"
            value={formData.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            required
          />
        </div>
      </FormSection>

      {/* 4. Professional Roles & Memberships */}
      <FormSection
        title="Leadership Roles & Memberships"
        description="Enter each entry on a new line"
      >
        <div className="form-grid">
          <TextArea
            label="Additional Roles (One per line)"
            value={formData.additionalRoles || ''}
            onChange={(e) => handleChange('additionalRoles', e.target.value)}
            hint="e.g. Guest Faculty — BITS Pilani (Off-Campus)"
          />
          <TextArea
            label="Professional Memberships (One per line)"
            value={formData.professionalMemberships || ''}
            onChange={(e) => handleChange('professionalMemberships', e.target.value)}
            hint="e.g. Senior Member IEEE, Life Member CSI"
          />
        </div>
      </FormSection>

      {/* 5. Headshot Asset */}
      <FormSection
        title="Profile Headshot"
        description="Official high-resolution portrait displayed across the portfolio"
      >
        <AssetUploader
          label="Profile Photo"
          currentAssetPath={formData.photoAsset}
          onAssetUploaded={(path) => handleChange('photoAsset', path)}
          allowedExtensions={['.jpg', '.jpeg', '.png']}
          hint="Upload PNG or JPEG portrait (max 20MB)"
        />
      </FormSection>

      {/* Sticky Save Bar */}
      <SaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
        lastSaved={lastSaved}
      />

      {/* Version Conflict Modal */}
      <VersionConflictDialog
        isOpen={showConflictDialog}
        onReload={() => {
          setShowConflictDialog(false);
          fetchProfile();
        }}
        onCancel={() => setShowConflictDialog(false)}
      />
    </div>
  );
};
