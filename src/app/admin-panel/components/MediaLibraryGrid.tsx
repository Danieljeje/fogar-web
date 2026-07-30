'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { mediaService, MediaItem } from '@/services/mediaService'; // ADJUST PATH if your alias differs

// NOTE: this is a LINK-based media library (paste a URL to wherever the file
// is already hosted), not a file-upload pipeline. The old fake version assumed
// S3 upload + ffmpeg compression + processing/draft/archived states + play
// counts + file sizes + low-bandwidth variants — none of that exists on the
// backend. Building real file upload/processing is a separate, larger feature.
const CATEGORIES = ['SERMON', 'SONG', 'ANNOUNCEMENT'];

interface AddMediaForm {
  title: string;
  description: string;
  mediaUrl: string;
  category: string;
}

const emptyForm: AddMediaForm = { title: '', description: '', mediaUrl: '', category: 'SERMON' };

function formatDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MediaLibraryGrid() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState<AddMediaForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<AddMediaForm>>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadMedia();
  }, []);

  async function loadMedia() {
    setLoading(true);
    try {
      const data = await mediaService.getAll();
      setItems(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load media library.');
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === 'all' ? items : items.filter((m) => m.category === filter);

  const validateForm = (): boolean => {
    const errors: Partial<AddMediaForm> = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.mediaUrl.trim()) {
      errors.mediaUrl = 'A link to the media is required';
    } else {
      try {
        new URL(form.mediaUrl.trim());
      } catch {
        errors.mediaUrl = 'Enter a valid URL (e.g. https://...)';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const newItem = await mediaService.upload({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        mediaUrl: form.mediaUrl.trim(),
        category: form.category,
      });
      setItems((prev) => [newItem, ...prev]);
      setAddModalOpen(false);
      setForm(emptyForm);
      setFormErrors({});
      toast.success('Media added to the library.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add media.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await mediaService.delete(id);
      setItems((prev) => prev.filter((m) => m.id !== id));
      setDeleteConfirmId(null);
      toast.success('Media item removed.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove media item.');
    }
  };

  const handleCloseModal = () => {
    setAddModalOpen(false);
    setForm(emptyForm);
    setFormErrors({});
  };

  return (
    <>
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground">Media Library</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{items.length} total item{items.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-0.5">
              {['all', ...CATEGORIES].map((f) => (
                <button
                  key={`mf-${f}`}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 capitalize ${filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {f.toLowerCase()}
                </button>
              ))}
            </div>
            <button onClick={() => setAddModalOpen(true)} className="btn-primary text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Media
            </button>
          </div>
        </div>

        {loading && (
          <div className="py-16 flex items-center justify-center text-sm text-muted-foreground">Loading media…</div>
        )}

        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Title', 'Category', 'Added By', 'Date', 'Link', 'Actions'].map((h) => (
                    <th key={`mlh-${h}`} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3 max-w-56">
                      <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                      {item.description && <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-neutral text-[10px] capitalize">{item.category.toLowerCase()}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {item.uploadedBy.firstName} {item.uploadedBy.lastName}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <a href={item.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-semibold hover:underline">
                        Open ↗
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {deleteConfirmId === item.id ? (
                          <>
                            <button onClick={() => handleDelete(item.id)} className="px-2 py-1 rounded-md bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition-colors">Confirm</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-[10px] font-bold hover:bg-muted/80 transition-colors">Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => setDeleteConfirmId(item.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors" title="Delete this media item">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="px-5 py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.263a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </div>
            <p className="text-sm font-semibold text-foreground">No media items in this category</p>
            <p className="text-xs text-muted-foreground mt-1">Add a link or change the filter to see items.</p>
          </div>
        )}
      </div>

      {/* Add Media Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleCloseModal} />
          <div className="relative bg-card rounded-2xl shadow-card-lg w-full max-w-lg p-6 fade-in">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-foreground">Add Media</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Link to a sermon, song, or announcement already hosted elsewhere</p>
              </div>
              <button onClick={handleCloseModal} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Walking in Covenant Faithfulness"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={`input-field ${formErrors.title ? 'border-red-400' : ''}`}
                />
                {formErrors.title && <p className="mt-1 text-xs text-red-500">{formErrors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="input-field"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Link <span className="text-red-500">*</span></label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.mediaUrl}
                  onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))}
                  className={`input-field ${formErrors.mediaUrl ? 'border-red-400' : ''}`}
                />
                {formErrors.mediaUrl && <p className="mt-1 text-xs text-red-500">{formErrors.mediaUrl}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Description (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Short description…"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="input-field resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={handleCloseModal} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving…' : 'Add Media'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}