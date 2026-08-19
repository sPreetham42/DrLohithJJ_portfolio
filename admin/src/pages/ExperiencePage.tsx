import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { adminApi, ApiClientError } from '../api/client';
import { ExperienceAdminRecord } from '../types';
import { TextField } from '../components/common/TextField';
import { Toggle } from '../components/common/Toggle';
import { Badge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { VersionConflictDialog } from '../components/common/VersionConflictDialog';
import { ErrorBanner } from '../components/common/ErrorBanner';

export const ExperiencePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ExperienceAdminRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExperienceAdminRecord | null>(null);
  const [modalFormData, setModalFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<ExperienceAdminRecord | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await adminApi.getExperience();
      setItems(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load experience records');
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
      id: `exp-${Date.now()}`,
      role: '',
      organization: '',
      startYear: '2026',
      endYear: 'Present',
      isCurrent: true,
      published: true,
      order: items.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ExperienceAdminRecord) => {
    setEditingItem(item);
    setModalFormData({
      id: item.id,
      role: item.role,
      organization: item.organization,
      startYear: item.start_year,
      endYear: item.end_year,
      isCurrent: Boolean(item.is_current),
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
        role: modalFormData.role,
        organization: modalFormData.organization,
        startYear: modalFormData.startYear,
        endYear: modalFormData.endYear,
        isCurrent: Boolean(modalFormData.isCurrent),
        published: Boolean(modalFormData.published),
        order: Number(modalFormData.order)
      };

      if (editingItem) {
        await adminApi.updateExperience(editingItem.id, payload, editingItem.version);
      } else {
        await adminApi.createExperience(payload);
      }

      setIsModalOpen(false);
      await fetchItems();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to save experience');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setErrorMessage(null);
      await adminApi.deleteExperience(itemToDelete.id, itemToDelete.version);
      setItemToDelete(null);
      await fetchItems();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to delete experience');
      }
    }
  };

  return (
    <div>
      <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>
            Academic & Leadership Timeline
          </div>
          <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Add Experience</span>
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" style={{ width: '28px', height: '28px' }} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            No experience records found.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Order</th>
                <th>Role & Position</th>
                <th>Institution / Organization</th>
                <th style={{ width: '140px' }}>Duration</th>
                <th style={{ width: '100px' }}>Current</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{item.display_order}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.role}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.organization}</td>
                  <td>{item.start_year} – {item.end_year}</td>
                  <td>
                    {item.is_current ? (
                      <Badge variant="featured">Active</Badge>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Past</span>
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
                {editingItem ? 'Edit Experience' : 'Add Experience'}
              </h3>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className="form-grid full">
                <TextField
                  label="Role / Designation"
                  value={modalFormData.role || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, role: e.target.value })}
                  required
                />
                <TextField
                  label="Organization / University"
                  value={modalFormData.organization || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, organization: e.target.value })}
                  required
                />
              </div>

              <div className="form-grid" style={{ marginTop: '16px' }}>
                <TextField
                  label="Start Year / Date"
                  value={modalFormData.startYear || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, startYear: e.target.value })}
                  hint="e.g. May 2026, 2018"
                  required
                />
                <TextField
                  label="End Year / Date"
                  value={modalFormData.endYear || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, endYear: e.target.value })}
                  hint="e.g. Present, 2024"
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
                  label="Current Active Role"
                  checked={modalFormData.isCurrent}
                  onChange={(checked) => setModalFormData({ ...modalFormData, isCurrent: checked })}
                  description="Displays as ongoing position"
                />
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
                  {isSaving ? 'Saving...' : editingItem ? 'Update Experience' : 'Create Experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        title="Delete Experience Entry"
        message={`Are you sure you want to permanently delete "${itemToDelete?.role}" at "${itemToDelete?.organization}"?`}
        confirmLabel="Delete Experience"
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
