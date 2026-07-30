'use client';
import React, { useEffect, useState } from 'react';
import { prayerService, PrayerRequest } from '@/services/prayerService';


function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const statusMeta: Record<string, { icon: string; color: string; verb: string }> = {
  PENDING: { icon: '⏳', color: 'bg-amber-50 text-amber-600', verb: 'is awaiting review' },
  APPROVED: { icon: '✅', color: 'bg-green-50 text-green-600', verb: 'was approved' },
  REJECTED: { icon: '❌', color: 'bg-red-50 text-red-600', verb: 'was not approved' },
};

export default function ActivityFeed() {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    load();
  }, []);

  async function load() {
    try {
      const data = await prayerService.getMyPrayers();
      setPrayers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3.5 border-b border-border">
        <h2 className="text-sm font-bold text-foreground">Recent Activity</h2>
        <p className="text-[11px] text-muted-foreground">Your prayer request activity</p>
      </div>

      {loading && (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">Loading…</div>
      )}

      {!loading && prayers.length === 0 && (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">
          No activity yet — submit a prayer request to get started.
        </div>
      )}

      {!loading && prayers.length > 0 && (
        <div className="divide-y divide-border">
          {prayers.map((p) => {
            const meta = statusMeta[p.status];
            return (
              <div key={p.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className={`w-7 h-7 rounded-lg ${meta.color} flex items-center justify-center flex-shrink-0 text-sm`}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-relaxed">
                    Your prayer &ldquo;{p.title}&rdquo; {meta.verb}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDate(p.moderatedAt || p.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}