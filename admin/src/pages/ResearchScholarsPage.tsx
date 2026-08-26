import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { adminApi, ApiClientError } from '../api/client';
import { ResearchScholarAdminRecord } from '../types';
import { TextField } from '../components/common/TextField';
import { Toggle } from '../components/common/Toggle';
import { Badge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { VersionConflictDialog } from '../components/common/VersionConflictDialog';
import { ErrorBanner } from '../components/common/ErrorBanner';

export const ResearchScholarsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ResearchScholarAdminRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResearchScholarAdminRecord | null>(null);
  const [modalFormData, setModalFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<ResearchScholarAdminRecord | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await adminApi.getResearchScholars();
      setItems(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load research scholars');
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
      id: `rs-${Date.now()}`,
      name: '',
      scholarId: '',
      badge: 'Co-guided',
      affiliation: 'MAHE Bangalore',
      guidance: 'Co-guided by Dr. Lohith J.J.',
      published: true,
      order: items.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ResearchScholarAdminRecord) => {
    setEditingItem(item);
    setModalFormData({
      id: item.id,
      name: item.name,
      scholarId: item.scholar_id || '',
      badge: item.badge || 'Co-guided',
      affiliation: item.affiliation,
      guidance: item.guidance || '',
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
        name: modalFormData.name,
        scholarId: modalFormData.scholarId || null,
        badge: modalFormData.badge || 'Co-guided',
        affiliation: modalFormData.affiliation,
        guidance: modalFormData.guidance || null,
        published: Boolean(modalFormData.published),
        order: Number(modalFormData.order)
      };

      if (editingItem) {
        await adminApi.updateResearchScholar(editingItem.id, payload, editingItem.version);
      } else {
        await adminApi.createResearchScholar(payload);
      }

      setIsModalOpen(false);
      await fetchItems();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to save research scholar');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      setErrorMessage(null);
      await adminApi.deleteResearchScholar(itemToDelete.id, itemToDelete.version);
      setItemToDelete(null);
      await fetchItems();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to delete research scholar');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {errorMessage && <ErrorBanner message={errorMessage} onClose={() => setErrorMessage(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--navy)' }}>Research Scholars</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Manage co-guided research scholars and doctoral candidates
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Add Scholar
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading research scholars...</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No research scholar records found. Click "Add Scholar" to add your first record.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--sage-subtle)' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Scholar Name</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Scholar ID</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Role / Badge</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Affiliation</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Guidance Note</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>{item.scholar_id || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className="scholar-badge" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                      {item.badge}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{item.affiliation}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{item.guidance || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Badge variant={item.published ? 'success' : 'neutral'}>
                      {item.published ? 'Published' : 'Draft'}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <button
                      className="btn-icon"
                      title="Edit"
                      onClick={() => handleOpenEdit(item)}
                      style={{ marginRight: '0.5rem' }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="btn-icon text-danger"
                      title="Delete"
                      onClick={() => setItemToDelete(item)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content card" style={{ width: '100%', maxWidth: '600px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--navy)' }}>
              {editingItem ? 'Edit Research Scholar' : 'Add New Research Scholar'}
            </h3>
            <form onSubmit={handleSaveModal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <TextField
                label="Scholar Full Name"
                required
                value={modalFormData.name || ''}
                onChange={(e) => setModalFormData({ ...modalFormData, name: e.target.value })}
                placeholder="e.g. Ms. Shyla Moses"
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <TextField
                  label="Scholar ID / Registration No."
                  value={modalFormData.scholarId || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, scholarId: e.target.value })}
                  placeholder="e.g. 251589001019"
                />
                <TextField
                  label="Role / Badge"
                  required
                  value={modalFormData.badge || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, badge: e.target.value })}
                  placeholder="e.g. Co-guided"
                />
              </div>
              <TextField
                label="Affiliation / University"
                required
                value={modalFormData.affiliation || ''}
                onChange={(e) => setModalFormData({ ...modalFormData, affiliation: e.target.value })}
                placeholder="e.g. MAHE Bangalore"
              />
              <TextField
                label="Guidance Note"
                value={modalFormData.guidance || ''}
                onChange={(e) => setModalFormData({ ...modalFormData, guidance: e.target.value })}
                placeholder="e.g. Co-guided by Dr. Lohith J.J."
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                <TextField
                  label="Display Order"
                  type="number"
                  value={modalFormData.order || 1}
                  onChange={(e) => setModalFormData({ ...modalFormData, order: e.target.value })}
                />
                <div style={{ paddingTop: '1.25rem' }}>
                  <Toggle
                    label="Published on Website"
                    checked={modalFormData.published}
                    onChange={(checked) => setModalFormData({ ...modalFormData, published: checked })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Scholar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {itemToDelete && (
        <ConfirmDialog
          title="Delete Research Scholar"
          message={`Are you sure you want to delete "${itemToDelete.name}"? This action cannot be undone.`}
          confirmLabel="Delete Scholar"
          onConfirm={handleDelete}
          onCancel={() => setItemToDelete(null)}
        />
      )}

      {/* Version Conflict */}
      {showConflictDialog && (
        <VersionConflictDialog
          onReload={() => {
            setShowConflictDialog(false);
            fetchItems();
          }}
        />
      )}
    </div>
  );
};
