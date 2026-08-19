import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, ExternalLink } from 'lucide-react';
import { adminApi, ApiClientError } from '../api/client';
import { PublicationAdminRecord } from '../types';
import { TextField } from '../components/common/TextField';
import { TextArea } from '../components/common/TextArea';
import { Select } from '../components/common/Select';
import { Toggle } from '../components/common/Toggle';
import { Badge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { VersionConflictDialog } from '../components/common/VersionConflictDialog';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { AssetUploader } from '../components/common/AssetUploader';

export const PublicationsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PublicationAdminRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit/Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PublicationAdminRecord | null>(null);
  const [modalFormData, setModalFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<PublicationAdminRecord | null>(null);

  // Concurrency Conflict State
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await adminApi.getPublications();
      setItems(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load publications');
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
      id: `pub-${Date.now()}`,
      codeNumber: `J${items.length + 1}`,
      title: '',
      authors: 'Dr. Lohith J.J. et al.',
      venue: '',
      publicationType: 'journal',
      year: new Date().getFullYear(),
      doi: '',
      externalUrl: '',
      pdfAssetId: '',
      featured: false,
      published: true,
      order: items.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PublicationAdminRecord) => {
    setEditingItem(item);
    setModalFormData({
      id: item.id,
      codeNumber: item.code_number || '',
      title: item.title,
      authors: item.authors,
      venue: item.venue,
      publicationType: item.publication_type,
      year: item.year,
      doi: item.doi || '',
      externalUrl: item.external_url || '',
      pdfAssetId: item.pdf_asset_id || '',
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
        codeNumber: modalFormData.codeNumber || null,
        title: modalFormData.title,
        authors: modalFormData.authors,
        venue: modalFormData.venue,
        publicationType: modalFormData.publicationType,
        year: Number(modalFormData.year),
        doi: modalFormData.doi || null,
        externalUrl: modalFormData.externalUrl || null,
        pdfAssetId: modalFormData.pdfAssetId || null,
        featured: Boolean(modalFormData.featured),
        published: Boolean(modalFormData.published),
        order: Number(modalFormData.order)
      };

      if (editingItem) {
        await adminApi.updatePublication(editingItem.id, payload, editingItem.version);
      } else {
        await adminApi.createPublication(payload);
      }

      setIsModalOpen(false);
      await fetchItems();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to save publication');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setErrorMessage(null);
      await adminApi.deletePublication(itemToDelete.id, itemToDelete.version);
      setItemToDelete(null);
      await fetchItems();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.code === 'CONCURRENCY_CONFLICT') {
        setShowConflictDialog(true);
      } else {
        setErrorMessage(err.message || 'Failed to delete publication');
      }
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.code_number && item.code_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.venue.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || item.publication_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

      <div className="table-container">
        {/* Toolbar */}
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <input
                type="text"
                placeholder="Search by title, code, venue..."
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="all">All Types</option>
              <option value="journal">Journals</option>
              <option value="conference">Conferences</option>
              <option value="book">Books / Chapters</option>
            </select>
          </div>

          <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Add Publication</span>
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" style={{ width: '28px', height: '28px' }} />
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            No publications found matching your filter criteria.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Code</th>
                <th>Title & Venue</th>
                <th style={{ width: '100px' }}>Type</th>
                <th style={{ width: '80px' }}>Year</th>
                <th style={{ width: '100px' }}>Featured</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                    {item.code_number || '—'}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {item.venue}
                      {item.doi && (
                        <a
                          href={`https://doi.org/${item.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginLeft: '8px', color: 'var(--accent-primary)', textDecoration: 'none' }}
                        >
                          [DOI]
                        </a>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize', fontSize: '0.825rem' }}>
                      {item.publication_type}
                    </span>
                  </td>
                  <td>{item.year}</td>
                  <td>
                    {item.featured ? (
                      <Badge variant="featured">Featured</Badge>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>No</span>
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
                        title="Edit publication"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '6px 10px' }}
                        onClick={() => setItemToDelete(item)}
                        title="Delete publication"
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingItem ? `Edit Publication: ${editingItem.code_number || editingItem.id}` : 'Add New Publication'}
              </h3>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className="form-grid">
                <TextField
                  label="Code Number"
                  value={modalFormData.codeNumber || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, codeNumber: e.target.value })}
                  hint="e.g. J1, J2, C1"
                />

                <Select
                  label="Publication Type"
                  value={modalFormData.publicationType}
                  onChange={(e) => setModalFormData({ ...modalFormData, publicationType: e.target.value })}
                  options={[
                    { value: 'journal', label: 'Journal Paper' },
                    { value: 'conference', label: 'Conference Proceeding' },
                    { value: 'book', label: 'Book / Book Chapter' }
                  ]}
                  required
                />

                <div className="form-group col-span-2">
                  <TextField
                    label="Publication Title"
                    value={modalFormData.title || ''}
                    onChange={(e) => setModalFormData({ ...modalFormData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group col-span-2">
                  <TextField
                    label="Authors List"
                    value={modalFormData.authors || ''}
                    onChange={(e) => setModalFormData({ ...modalFormData, authors: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group col-span-2">
                  <TextField
                    label="Journal / Venue / Publisher"
                    value={modalFormData.venue || ''}
                    onChange={(e) => setModalFormData({ ...modalFormData, venue: e.target.value })}
                    required
                  />
                </div>

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

                <TextField
                  label="DOI (Digital Object Identifier)"
                  value={modalFormData.doi || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, doi: e.target.value })}
                  hint="e.g. 10.1007/s41870-024-01909-8"
                />

                <TextField
                  label="External URL / Publisher Link"
                  type="url"
                  value={modalFormData.externalUrl || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, externalUrl: e.target.value })}
                />

                <div className="form-group col-span-2">
                  <AssetUploader
                    label="PDF Pre-print / Paper Asset (Optional)"
                    currentAssetPath={modalFormData.pdfAssetId}
                    onAssetUploaded={(path) => setModalFormData({ ...modalFormData, pdfAssetId: path })}
                    allowedExtensions={['.pdf']}
                    hint="Upload PDF pre-print document (max 20MB)"
                  />
                </div>

                <div className="form-group col-span-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Toggle
                    label="Featured on Homepage"
                    checked={modalFormData.featured}
                    onChange={(checked) => setModalFormData({ ...modalFormData, featured: checked })}
                    description="Highlight in Top Publications"
                  />
                  <Toggle
                    label="Publicly Visible"
                    checked={modalFormData.published}
                    onChange={(checked) => setModalFormData({ ...modalFormData, published: checked })}
                    description="Include in public portfolio list"
                  />
                </div>
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
                  {isSaving ? 'Saving...' : editingItem ? 'Update Publication' : 'Create Publication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        title="Delete Publication"
        message={`Are you sure you want to permanently delete "${itemToDelete?.title}" (${itemToDelete?.code_number || itemToDelete?.id})? This action cannot be undone.`}
        confirmLabel="Delete Publication"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Concurrency Conflict */}
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
