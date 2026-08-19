import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { adminApi, ApiClientError } from '../api/client';
import { EducationAdminRecord } from '../types';
import { TextField } from '../components/common/TextField';
import { TextArea } from '../components/common/TextArea';
import { Toggle } from '../components/common/Toggle';
import { Badge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { VersionConflictDialog } from '../components/common/VersionConflictDialog';
import { ErrorBanner } from '../components/common/ErrorBanner';

export const EducationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<EducationAdminRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EducationAdminRecord | null>(null);
  const [modalFormData, setModalFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<EducationAdminRecord | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await adminApi.getEducation();
      setItems(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load education records');
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
      id: `edu-${Date.now()}`,
      degree: '',
      institution: '',
      year: '2026',
      thesis: '',
      published: true,
      order: items.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: EducationAdminRecord) => {
    setEditingItem(item);
    setModalFormData({
      id: item.id,
      degree: item.degree,
      institution: item.institution,
      year: item.year,
      thesis: item.thesis || '',
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
        degree: modalFormData.degree,
        institution: modalFormData.institution,
        year: modalFormData.year,
        thesis: modalFormData.thesis || null,
        published: Boolean(modalFormData.published),
        order: Number(modalFormData.order)
      };

      if (editingItem) {
        await adminApi.updateEducation(editingItem.id, payload, editingItem.version);
      } else {
        await adminApi.createEducation(payload);
      }

      setIsModalOpen(false);
      await fetchItems();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to save education record');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setErrorMessage(null);
      await adminApi.deleteEducation(itemToDelete.id, itemToDelete.version);
      setItemToDelete(null);
      await fetchItems();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to delete education record');
      }
    }
  };

  return (
    <div>
      <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>
            Degrees & Academic Qualifications
          </div>
          <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Add Degree</span>
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" style={{ width: '28px', height: '28px' }} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            No educational qualifications found.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Order</th>
                <th>Degree / Qualification</th>
                <th>University / Institute</th>
                <th style={{ width: '100px' }}>Graduation Year</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{item.display_order}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.degree}</div>
                    {item.thesis && (
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                        Thesis: {item.thesis}
                      </div>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.institution}</td>
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
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingItem ? 'Edit Qualification' : 'Add Qualification'}
              </h3>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className="form-grid full">
                <TextField
                  label="Degree Name"
                  value={modalFormData.degree || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, degree: e.target.value })}
                  hint="e.g. Doctor of Philosophy (Ph.D.) in Computer Science & Engineering"
                  required
                />
                <TextField
                  label="University / Institution"
                  value={modalFormData.institution || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, institution: e.target.value })}
                  hint="e.g. National Institute of Technology Tiruchirappalli (NIT Trichy)"
                  required
                />
              </div>

              <div className="form-grid" style={{ marginTop: '16px' }}>
                <TextField
                  label="Year of Completion"
                  value={modalFormData.year || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, year: e.target.value })}
                  hint="e.g. 2024, 2009, 2005"
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
                  label="Thesis Title / Focus Area (Optional)"
                  value={modalFormData.thesis || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, thesis: e.target.value })}
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
                  {isSaving ? 'Saving...' : editingItem ? 'Update Degree' : 'Create Degree'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        title="Delete Educational Qualification"
        message={`Are you sure you want to permanently delete "${itemToDelete?.degree}" (${itemToDelete?.institution})?`}
        confirmLabel="Delete Degree"
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
