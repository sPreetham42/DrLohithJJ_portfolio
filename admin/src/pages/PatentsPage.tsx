import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Award } from 'lucide-react';
import { adminApi, ApiClientError } from '../api/client';
import { PatentAdminRecord } from '../types';
import { TextField } from '../components/common/TextField';
import { Toggle } from '../components/common/Toggle';
import { Badge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { VersionConflictDialog } from '../components/common/VersionConflictDialog';
import { ErrorBanner } from '../components/common/ErrorBanner';

export const PatentsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PatentAdminRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PatentAdminRecord | null>(null);
  const [modalFormData, setModalFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<PatentAdminRecord | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await adminApi.getPatents();
      setItems(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load patents');
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
      id: `pat-${Date.now()}`,
      title: '',
      domain: 'Electronics',
      publicationDate: new Date().toISOString().split('T')[0],
      applicationNumber: '',
      published: true,
      order: items.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PatentAdminRecord) => {
    setEditingItem(item);
    setModalFormData({
      id: item.id,
      title: item.title,
      domain: item.domain,
      publicationDate: item.publication_date,
      applicationNumber: item.application_number,
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
        domain: modalFormData.domain,
        publicationDate: modalFormData.publicationDate,
        applicationNumber: modalFormData.applicationNumber,
        published: Boolean(modalFormData.published),
        order: Number(modalFormData.order)
      };

      if (editingItem) {
        await adminApi.updatePatent(editingItem.id, payload, editingItem.version);
      } else {
        await adminApi.createPatent(payload);
      }

      setIsModalOpen(false);
      await fetchItems();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to save patent');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      setErrorMessage(null);
      await adminApi.deletePatent(itemToDelete.id, itemToDelete.version);
      setItemToDelete(null);
      await fetchItems();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to delete patent');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {errorMessage && <ErrorBanner message={errorMessage} onClose={() => setErrorMessage(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--navy)' }}>Patents</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Manage published patent records displayed in the Publications section
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Add Patent
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading patents...</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No patent records found. Click "Add Patent" to add your first patent.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--sage-subtle)' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Code</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Title</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Domain</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Publication Date</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Application No.</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>P{idx + 1}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500, maxWidth: '360px' }}>{item.title}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{item.domain}</td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>{item.publication_date}</td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>{item.application_number}</td>
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
              {editingItem ? 'Edit Patent' : 'Add New Patent'}
            </h3>
            <form onSubmit={handleSaveModal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <TextField
                label="Patent Title"
                required
                value={modalFormData.title || ''}
                onChange={(e) => setModalFormData({ ...modalFormData, title: e.target.value })}
                placeholder="e.g. Intelli-Port: An Autonomous Multi-Functional Service Robot..."
              />
              <TextField
                label="Domain"
                required
                value={modalFormData.domain || ''}
                onChange={(e) => setModalFormData({ ...modalFormData, domain: e.target.value })}
                placeholder="e.g. Electronics"
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <TextField
                  label="Publication Date"
                  required
                  type="text"
                  value={modalFormData.publicationDate || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, publicationDate: e.target.value })}
                  placeholder="e.g. 31 July 2026 or 2026-07-31"
                />
                <TextField
                  label="Application Number"
                  required
                  value={modalFormData.applicationNumber || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, applicationNumber: e.target.value })}
                  placeholder="e.g. 202641091778"
                />
              </div>
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
                  {isSaving ? 'Saving...' : 'Save Patent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {itemToDelete && (
        <ConfirmDialog
          title="Delete Patent Record"
          message={`Are you sure you want to delete "${itemToDelete.title}"? This action cannot be undone.`}
          confirmLabel="Delete Patent"
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
