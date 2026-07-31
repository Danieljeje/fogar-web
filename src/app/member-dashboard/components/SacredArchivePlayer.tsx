'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { mediaService, MediaItem } from '@/services/mediaService';


function isRecent(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 3 * 24 * 60 * 60 * 1000;
}

function formatDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function SacredArchivePlayer() {
  const [sermons, setSermons] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await mediaService.getByCategory('SERMON');
      setSermons(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load sermons.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-bold text-foreground">Sermon Feed</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Latest sermons from the media library</p>
      </div>

      {loading && (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">Loading sermons…</div>
      )}

      {!loading && sermons.length === 0 && (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">No sermons uploaded yet.</div>
      )}

      {!loading && sermons.length > 0 && (
        <div className="divide-y divide-border">
          {sermons.map((sermon) => (
            <div key={sermon.id} className="px-5 py-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-start gap-3">
                <a
                  href={sermon.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-50 text-primary hover:bg-primary hover:text-white transition-all duration-150"
                  title="Open sermon"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </a>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground truncate">{sermon.title}</p>
                    {isRecent(sermon.createdAt) && <span className="badge-success text-[10px]">New</span>}
                  </div>
                  {sermon.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{sermon.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">{formatDate(sermon.createdAt)}</span>
                    <span className="text-xs text-muted-foreground">
                      By {sermon.uploadedBy.firstName} {sermon.uploadedBy.lastName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}