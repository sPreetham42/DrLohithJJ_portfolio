import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { adminApi, ApiClientError } from '../api/client';
import { SkillCategoryAdminRecord } from '../types';
import { TextField } from '../components/common/TextField';
import { TextArea } from '../components/common/TextArea';
import { Toggle } from '../components/common/Toggle';
import { Badge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { VersionConflictDialog } from '../components/common/VersionConflictDialog';
import { ErrorBanner } from '../components/common/ErrorBanner';

export const SkillsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SkillCategoryAdminRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SkillCategoryAdminRecord | null>(null);
  const [modalFormData, setModalFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<SkillCategoryAdminRecord | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await adminApi.getSkills();
      setItems(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load skill categories');
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
      id: `skill-${Date.now()}`,
      category: '',
      skills: '',
      published: true,
      order: items.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SkillCategoryAdminRecord) => {
    setEditingItem(item);
    const parsedSkills = JSON.parse(item.skills_json || '[]').join('\n');
    setModalFormData({
      id: item.id,
      category: item.category,
      skills: parsedSkills,
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

      const skillsArray = modalFormData.skills
        .split('\n')
        .map((s: string) => s.trim())
        .filter(Boolean);

      const payload = {
        id: modalFormData.id,
        category: modalFormData.category,
        skills: skillsArray,
        published: Boolean(modalFormData.published),
        order: Number(modalFormData.order)
      };

      if (editingItem) {
        await adminApi.updateSkill(editingItem.id, payload, editingItem.version);
      } else {
        await adminApi.createSkill(payload);
      }

      setIsModalOpen(false);
      await fetchItems();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to save skill category');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setErrorMessage(null);
      await adminApi.deleteSkill(itemToDelete.id, itemToDelete.version);
      setItemToDelete(null);
      await fetchItems();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to delete skill category');
      }
    }
  };

  return (
    <div>
      <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>
            Technical Skill Categories ({items.length})
          </div>
          <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" style={{ width: '28px', height: '28px' }} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            No skill categories found.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Order</th>
                <th style={{ width: '240px' }}>Category Name</th>
                <th>Skills List</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const parsedSkills: string[] = JSON.parse(item.skills_json || '[]');
                return (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{item.display_order}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.category}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {parsedSkills.map((sk, idx) => (
                          <span
                            key={idx}
                            style={{
                              backgroundColor: 'var(--bg-card-hover)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8rem',
                              border: '1px solid var(--border-subtle)'
                            }}
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
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
                );
              })}
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
                {editingItem ? 'Edit Skill Category' : 'Add Skill Category'}
              </h3>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className="form-grid full">
                <TextField
                  label="Category Name"
                  value={modalFormData.category || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, category: e.target.value })}
                  hint="e.g. Core Research Areas, Programming & Frameworks"
                  required
                />

                <TextField
                  label="Display Order"
                  type="number"
                  value={modalFormData.order || 1}
                  onChange={(e) => setModalFormData({ ...modalFormData, order: Number(e.target.value) })}
                  required
                />

                <TextArea
                  label="Skills (One per line)"
                  value={modalFormData.skills || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, skills: e.target.value })}
                  hint="Enter each skill, technology, or framework on a new line"
                  required
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
                  {isSaving ? 'Saving...' : editingItem ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        title="Delete Skill Category"
        message={`Are you sure you want to permanently delete category "${itemToDelete?.category}"?`}
        confirmLabel="Delete Category"
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
