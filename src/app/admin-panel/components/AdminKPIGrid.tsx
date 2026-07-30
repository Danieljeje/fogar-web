'use client';

import React, { useEffect, useState } from 'react';
import { userService } from '@/services/userService';
import { prayerService } from '@/services/prayerService';
import { mediaService } from '@/services/mediaService';

interface DashboardStats {
  totalMembers: number;
  pendingPrayerRequests: number;
  departments: number;
  mediaUploads: number;
}

export default function AdminKPIGrid() {

  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    pendingPrayerRequests: 0,
    departments: 0,
    mediaUploads: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadDashboard();
  }, []);

async function loadDashboard() {
  try {
    const [
      memberCount,
      departmentList,
      pendingPrayerRequests,
      mediaUploads,
    ] = await Promise.all([
      userService.countMembers(),
      userService.getDepartments(),
      prayerService.getPendingCount(),
      mediaService.count(),
    ]);

    setStats({
      totalMembers: memberCount.totalMembers,
      pendingPrayerRequests,
      departments: departmentList.length,
      mediaUploads,
    });

  } catch (err) {
    console.error("Failed to load dashboard:", err);
  } finally {
    setLoading(false);
  }
}

  // "Volunteer Coverage" and "Pending Approvals" cards are still removed —
  // no roster system or member-approval status field exists yet. Media
  // Uploads is back now that the Media Library backend is real.
  const kpis = [
    {
      id: 'members',
      label: 'Total Members',
      value: stats.totalMembers,
      sub: 'Registered church members',
      accent: 'bg-indigo-50 border-indigo-100',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      dot: 'bg-emerald-500',
      icon: MembersIcon,
    },
    {
      id: 'prayers',
      label: 'Prayer Requests',
      value: stats.pendingPrayerRequests,
      sub: 'Awaiting moderation',
      accent: 'bg-purple-50 border-purple-100',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      dot: 'bg-purple-500',
      icon: PrayerIcon,
    },
    {
      id: 'departments',
      label: 'Departments',
      value: stats.departments,
      sub: 'Active departments',
      accent: 'bg-sky-50 border-sky-100',
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-600',
      dot: 'bg-sky-500',
      icon: DepartmentIcon,
    },
    {
      id: 'media',
      label: 'Media Uploads',
      value: stats.mediaUploads,
      sub: 'Sermons, songs & more',
      accent: 'bg-emerald-50 border-emerald-100',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      dot: 'bg-emerald-500',
      icon: MediaIcon,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 rounded-xl border bg-white animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.id} className={`card p-4 border ${item.accent}`}>
            <div className="flex justify-between items-start">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.iconBg}`}>
                <Icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <span className={`w-2 h-2 rounded-full ${item.dot}`} />
            </div>
            <h2 className="text-3xl font-bold mt-4">{item.value}</h2>
            <p className="text-xs uppercase tracking-wide text-gray-500 mt-1">{item.label}</p>
            <p className="text-xs text-gray-500 mt-2">{item.sub}</p>
          </div>
        );
      })}
    </div>
  );
}

function MembersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        d="M17 20h5v-1a4 4 0 00-5-3.87M9 20H4v-1a4 4 0 015-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75M12 12a4 4 0 100-8 4 4 0 000 8z"/>
    </svg>
  );
}

function PrayerIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 21s-8-5.5-8-11a5 5 0 019-3 5 5 0 019 3c0 5.5-8 11-8 11z"/></svg>;
}

function DepartmentIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M4 21h16M7 21V7h10v14M10 10h4M10 14h4"/></svg>;
}

function MediaIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2"/><path strokeWidth="2" d="M8 13l3-3 5 5"/></svg>;
}