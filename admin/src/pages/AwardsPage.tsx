import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { adminApi, ApiClientError } from '../api/client';
import { AwardAdminRecord } from '../types';
import { TextField } from '../components/common/TextField';
import { TextArea } from '../components/common/TextArea';
import { Toggle } from '../components/common/Toggle';
import { Badge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { VersionConflictDialog } from '../components/common/VersionConflictDialog';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { AssetUploader } from '../components/common/AssetUploader';

export const AwardsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AwardAdminRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AwardAdminRecord | null>(null);
  const [modalFormData, setModalFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<AwardAdminRecord | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await adminApi.getAwards();
      setItems(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load awards');
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
      id: `award-${Date.now()}`,
      title: '',
      organization: '',
      year: '2026',
      description: '',
      certificateAssetId: '',
      published: true,
      order: items.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AwardAdminRecord) => {
    setEditingItem(item);
    setModalFormData({
      id: item.id,
      title: item.title,
      organization: item.organization,
      year: item.year,
      description: item.description || '',
      certificateAssetId: item.certificate_asset_id || '',
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
        title: modalFormData.title,
        organization: modalFormData.organization,
        year: modalFormData.year,
        description: modalFormData.description || null,
        certificateAssetId: modalFormData.certificateAssetId || null,
        published: Boolean(modalFormData.published),
        order: Number(modalFormData.order)
      };

      if (editingItem) {
        await adminApi.updateAward(editingItem.id, payload, editingItem.version);
      } else {
        await adminApi.createAward(payload);
      }

      setIsModalOpen(false);
      await fetchItems();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to save award');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setErrorMessage(null);
      await adminApi.deleteAward(itemToDelete.id, itemToDelete.version);
      setItemToDelete(null);
      await fetchItems();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to delete award');
      }
    }
  };

  return (
    <div>
      <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>
            Honors, Grants & State Recognitions ({items.length})
          </div>
          <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Add Award / Grant</span>
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" style={{ width: '28px', height: '28px' }} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            No awards found.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Order</th>
                <th>Award / Honor Title</th>
                <th>Awarding Body / Organization</th>
                <th style={{ width: '100px' }}>Year</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{item.display_order}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.title}</div>
                    {item.description && (
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.organization}</td>
                  <td>{item.year}</td>
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
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingItem ? 'Edit Award / Grant' : 'Add New Award / Grant'}
              </h3>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className="form-grid full">
                <TextField
                  label="Award / Grant Title"
                  value={modalFormData.title || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, title: e.target.value })}
                  required
                />
                <TextField
                  label="Awarding Organization / Agency"
                  value={modalFormData.organization || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, organization: e.target.value })}
                  required
                />
              </div>

              <div className="form-grid" style={{ marginTop: '16px' }}>
                <TextField
                  label="Year / Period"
                  value={modalFormData.year || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, year: e.target.value })}
                  hint="e.g. 2026, 2023-2024"
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

              <div style={{ marginTop: '16px' }}>
                <TextArea
                  label="Description / Grant Grantee Details (Optional)"
                  value={modalFormData.description || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, description: e.target.value })}
                />
              </div>

              <div style={{ marginTop: '16px' }}>
                <AssetUploader
                  label="Certificate / Sanction Letter PDF (Optional)"
                  currentAssetPath={modalFormData.certificateAssetId}
                  onAssetUploaded={(path) => setModalFormData({ ...modalFormData, certificateAssetId: path })}
                  allowedExtensions={['.pdf', '.jpg', '.png']}
                />
              </div>

              <div style={{ marginTop: '16px' }}>
                <Toggle
                  label="Publicly Visible"
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
                  {isSaving ? 'Saving...' : editingItem ? 'Update Award' : 'Create Award'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        title="Delete Award"
        message={`Are you sure you want to permanently delete "${itemToDelete?.title}" (${itemToDelete?.organization})?`}
        confirmLabel="Delete Award"
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
