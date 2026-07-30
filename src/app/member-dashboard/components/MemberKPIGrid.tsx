'use client';
import React, { useEffect, useState } from 'react';
import { prayerService } from '@/services/prayerService';
import { mediaService } from '@/services/mediaService';

// "Upcoming Shifts" and "Prayer Watch Hours" removed — no roster/rota or
// prayer-watch-scheduling backend exists anywhere in the app. Only two real
// numbers exist right now: the member's own prayer request count and how
// many sermons are in the library.
interface Stats {
  myPrayerCount: number;
  sermonCount: number;
}

export default function MemberKPIGrid() {
  const [stats, setStats] = useState<Stats>({ myPrayerCount: 0, sermonCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    load();
  }, []);

  async function load() {
    try {
      const [myPrayers, sermons] = await Promise.all([
        prayerService.getMyPrayers(),
        mediaService.getByCategory('SERMON'),
      ]);
      setStats({ myPrayerCount: myPrayers.length, sermonCount: sermons.length });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const kpis = [
    {
      id: 'kpi-prayer',
      label: 'My Prayer Requests',
      value: stats.myPrayerCount,
      sub: 'Submitted by you',
      icon: PrayerKPIIcon,
      accent: 'bg-amber-50 border-amber-100',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      id: 'kpi-sermons',
      label: 'Sermons Available',
      value: stats.sermonCount,
      sub: 'In the media library',
      icon: MediaKPIIcon,
      accent: 'bg-emerald-50 border-emerald-100',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-white animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div key={kpi.id} className={`card p-5 border ${kpi.accent} card-hover`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${kpi.iconBg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${kpi.iconColor}`} />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-foreground tabular-nums">{kpi.value}</p>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5 uppercase tracking-wider">{kpi.label}</p>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{kpi.sub}</p>
          </div>
        );
      })}
    </div>
  );
}

function PrayerKPIIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
}
function MediaKPIIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}