import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { adminApi, ApiClientError } from '../api/client';
import { SocialLinkAdminRecord } from '../types';
import { TextField } from '../components/common/TextField';
import { Toggle } from '../components/common/Toggle';
import { Badge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { VersionConflictDialog } from '../components/common/VersionConflictDialog';
import { ErrorBanner } from '../components/common/ErrorBanner';

export const SocialLinksPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SocialLinkAdminRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SocialLinkAdminRecord | null>(null);
  const [modalFormData, setModalFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<SocialLinkAdminRecord | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await adminApi.getSocialLinks();
      setItems(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load social links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalFormData({
      id: `social-${Date.now()}`,
      platform: '',
      url: 'https://',
      icon: '',
      visible: true,
      published: true,
      order: items.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SocialLinkAdminRecord) => {
    setEditingItem(item);
    setModalFormData({
      id: item.id,
      platform: item.platform,
      url: item.url,
      icon: item.icon,
      visible: Boolean(item.visible),
      published: Boolean(item.published),
      order: item.display_order
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const payload = {
        id: modalFormData.id,
        platform: modalFormData.platform,
        url: modalFormData.url,
        icon: modalFormData.icon,
        visible: Boolean(modalFormData.visible),
        published: Boolean(modalFormData.published),
        order: Number(modalFormData.order)
      };

      if (editingItem) {
        await adminApi.updateSocialLink(editingItem.id, payload, editingItem.version);
      } else {
        await adminApi.createSocialLink(payload);
      }

      setIsModalOpen(false);
      await fetchItems();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to save social link');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setErrorMessage(null);
      await adminApi.deleteSocialLink(itemToDelete.id, itemToDelete.version);
      setItemToDelete(null);
      await fetchItems();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to delete social link');
      }
    }
  };

  return (
    <div>
      <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>
            Academic Identifiers & Verified Profiles ({items.length})
          </div>
          <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Add Profile Link</span>
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" style={{ width: '28px', height: '28px' }} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            No profile links found.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Order</th>
                <th>Platform / Profile</th>
                <th>Target URL</th>
                <th style={{ width: '100px' }}>Visibility</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{item.display_order}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.platform}</td>
                  <td>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--accent-primary)',
                        textDecoration: 'none',
                        fontSize: '0.85rem'
                      }}
                    >
                      <span>{item.url}</span>
                      <ExternalLink size={12} />
                    </a>
                  </td>
                  <td>
                    {item.visible ? (
                      <span style={{ color: 'var(--accent-success)', fontSize: '0.8rem' }}>Visible</span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Hidden</span>
                    )}
                  </td>
                  <td>
                    {item.published ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="muted">Hidden</Badge>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px' }}
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '6px 10px' }}
                        onClick={() => setItemToDelete(item)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingItem ? 'Edit Profile Link' : 'Add Profile Link'}
              </h3>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className="form-grid full">
                <TextField
                  label="Platform / Directory Name"
                  value={modalFormData.platform || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, platform: e.target.value })}
                  hint="e.g. Google Scholar, ORCID, Scopus, Web of Science, LinkedIn, Vidwan, CRSI"
                  required
                />
                <TextField
                  label="Target Profile URL"
                  type="url"
                  value={modalFormData.url || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, url: e.target.value })}
                  required
                />
                <TextField
                  label="Icon Reference"
                  value={modalFormData.icon || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, icon: e.target.value })}
                  hint="Icon name or SVG identifier"
                  required
                />
                <TextField
                  label="Display Order"
                  type="number"
                  value={modalFormData.order || 1}
                  onChange={(e) => setModalFormData({ ...modalFormData, order: Number(e.target.value) })}
                  required
                />
              </div>

              <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Toggle
                  label="Visible on Sidebar"
                  checked={modalFormData.visible}
                  onChange={(checked) => setModalFormData({ ...modalFormData, visible: checked })}
                />
                <Toggle
                  label="Published"
                  checked={modalFormData.published}
                  onChange={(checked) => setModalFormData({ ...modalFormData, published: checked })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingItem ? 'Update Link' : 'Create Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        title="Delete Profile Link"
        message={`Are you sure you want to permanently delete link for "${itemToDelete?.platform}"?`}
        confirmLabel="Delete Link"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

      <VersionConflictDialog
        isOpen={showConflictDialog}
        onReload={() => {
          setShowConflictDialog(false);
          setIsModalOpen(false);
          fetchItems();
        }}
        onCancel={() => setShowConflictDialog(false)}
      />
    </div>
  );
};
