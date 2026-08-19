import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { adminApi, ApiClientError } from '../api/client';
import { TalkAdminRecord } from '../types';
import { TextField } from '../components/common/TextField';
import { TextArea } from '../components/common/TextArea';
import { Toggle } from '../components/common/Toggle';
import { Badge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { VersionConflictDialog } from '../components/common/VersionConflictDialog';
import { ErrorBanner } from '../components/common/ErrorBanner';

export const TalksPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<TalkAdminRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TalkAdminRecord | null>(null);
  const [modalFormData, setModalFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<TalkAdminRecord | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await adminApi.getTalks();
      setItems(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load invited talks');
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
      id: `talk-${Date.now()}`,
      title: '',
      venue: '',
      dateString: '2026',
      year: new Date().getFullYear(),
      featured: false,
      published: true,
      order: items.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: TalkAdminRecord) => {
    setEditingItem(item);
    setModalFormData({
      id: item.id,
      title: item.title,
      venue: item.venue,
      dateString: item.date_string,
      year: item.year,
      featured: Boolean(item.featured),
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
        venue: modalFormData.venue,
        dateString: modalFormData.dateString,
        year: Number(modalFormData.year),
        featured: Boolean(modalFormData.featured),
        published: Boolean(modalFormData.published),
        order: Number(modalFormData.order)
      };

      if (editingItem) {
        await adminApi.updateTalk(editingItem.id, payload, editingItem.version);
      } else {
        await adminApi.createTalk(payload);
      }

      setIsModalOpen(false);
      await fetchItems();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to save talk');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setErrorMessage(null);
      await adminApi.deleteTalk(itemToDelete.id, itemToDelete.version);
      setItemToDelete(null);
      await fetchItems();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to delete talk');
      }
    }
  };

  const availableYears = Array.from(new Set(items.map((t) => t.year))).sort((a, b) => b - a);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.venue.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesYear = yearFilter === 'all' || item.year.toString() === yearFilter;
    return matchesSearch && matchesYear;
  });

  return (
    <div>
      <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <input
                type="text"
                placeholder="Search by topic, venue, host..."
                className="form-input search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px' }}
              />
              <Search
                size={16}
                color="var(--text-dim)"
                style={{ position: 'absolute', left: '12px', top: '12px' }}
              />
            </div>

            <select
              className="form-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={{ width: '140px' }}
            >
              <option value="all">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr.toString()}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Add Invited Talk</span>
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" style={{ width: '28px', height: '28px' }} />
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            No invited talks found matching your search.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th>Talk Title & Topic</th>
                <th>Host Institution & Venue</th>
                <th style={{ width: '100px' }}>Date</th>
                <th style={{ width: '80px' }}>Year</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.title}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.venue}</td>
                  <td>{item.date_string}</td>
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
                        title="Edit talk"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '6px 10px' }}
                        onClick={() => setItemToDelete(item)}
                        title="Delete talk"
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
                {editingItem ? 'Edit Invited Talk' : 'Add New Invited Talk'}
              </h3>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className="form-grid full">
                <TextField
                  label="Talk Title / Topic"
                  value={modalFormData.title || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, title: e.target.value })}
                  required
                />
                <TextField
                  label="Host Institution / Conference Venue"
                  value={modalFormData.venue || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, venue: e.target.value })}
                  required
                />
              </div>

              <div className="form-grid" style={{ marginTop: '16px' }}>
                <TextField
                  label="Date String"
                  value={modalFormData.dateString || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, dateString: e.target.value })}
                  hint="e.g. October 2026, 15 May 2025"
                  required
                />
                <TextField
                  label="Year"
                  type="number"
                  value={modalFormData.year || 2026}
                  onChange={(e) => setModalFormData({ ...modalFormData, year: Number(e.target.value) })}
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
                  label="Featured Talk"
                  checked={modalFormData.featured}
                  onChange={(checked) => setModalFormData({ ...modalFormData, featured: checked })}
                  description="Highlight on homepage"
                />
                <Toggle
                  label="Publicly Visible"
                  checked={modalFormData.published}
                  onChange={(checked) => setModalFormData({ ...modalFormData, published: checked })}
                  description="Display in portfolio"
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
                  {isSaving ? 'Saving...' : editingItem ? 'Update Talk' : 'Create Talk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        title="Delete Invited Talk"
        message={`Are you sure you want to permanently delete "${itemToDelete?.title}" (${itemToDelete?.venue})? This action cannot be undone.`}
        confirmLabel="Delete Talk"
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
