'use client';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface ShiftItem {
  id: string;
  serviceDate: string;
  serviceTime: string;
  serviceType: string;
  role: string;
  department: string;
  venue: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  coordinator: string;
}

const initialShifts: ShiftItem[] = [
  { id: 'shift-001', serviceDate: '20 Jul 2026', serviceTime: '8:00 AM', serviceType: 'First Service', role: 'Lead Vocalist', department: 'Youth Choir', venue: 'Main Auditorium', status: 'pending', coordinator: 'Bro. Emeka Eze' },
  { id: 'shift-002', serviceDate: '20 Jul 2026', serviceTime: '10:30 AM', serviceType: 'Second Service', role: 'Backup Vocalist', department: 'Youth Choir', venue: 'Main Auditorium', status: 'accepted', coordinator: 'Bro. Emeka Eze' },
  { id: 'shift-003', serviceDate: '27 Jul 2026', serviceTime: '8:00 AM', serviceType: 'First Service', role: 'Lead Vocalist', department: 'Youth Choir', venue: 'Main Auditorium', status: 'pending', coordinator: 'Bro. Emeka Eze' },
  { id: 'shift-004', serviceDate: '03 Aug 2026', serviceTime: '10:30 AM', serviceType: 'Midweek Bible Study', role: 'Worship Leader', department: 'Youth Choir', venue: 'Chapel Hall', status: 'pending', coordinator: 'Sis. Ngozi Adeyemi' },
];

const statusConfig = {
  pending: { label: 'Pending', className: 'badge-warning' },
  accepted: { label: 'Accepted', className: 'badge-success' },
  declined: { label: 'Declined', className: 'badge-danger' },
  completed: { label: 'Completed', className: 'badge-neutral' },
};

export default function RosterSchedulePanel() {
  const [shifts, setShifts] = useState<ShiftItem[]>(initialShifts);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAction = async (id: string, action: 'accepted' | 'declined') => {
    setLoadingId(id);
    // BACKEND INTEGRATION: PUT /api/rosters/{id}/respond with { status: action }
    // Node.js engine sends push notification to coordinator after update
    await new Promise((r) => setTimeout(r, 900));
    setShifts((prev) => prev.map((s) => (s.id === id ? { ...s, status: action } : s)));
    setLoadingId(null);
    toast.success(action === 'accepted' ? 'Shift accepted! Your coordinator has been notified.' : 'Shift declined. The coordinator will be notified to reassign.');
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-base font-bold text-foreground">My Roster & Schedules</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Upcoming service shifts assigned to you</p>
        </div>
        <span className="badge-primary">{shifts.filter((s) => s.status === 'pending').length} pending</span>
      </div>

      <div className="divide-y divide-border">
        {shifts.map((shift) => {
          const sc = statusConfig[shift.status];
          const isPending = shift.status === 'pending';
          return (
            <div key={shift.id} className="px-5 py-4 hover:bg-muted/30 transition-colors group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-indigo-600 leading-none">{shift.serviceDate.split(' ')[0]}</span>
                    <span className="text-[9px] text-indigo-400 leading-none mt-0.5">{shift.serviceDate.split(' ')[1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{shift.serviceType}</p>
                      <span className={`${sc.className} text-[10px]`}>{sc.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {shift.serviceTime} · {shift.role} · {shift.venue}
                    </p>
                    <p className="text-xs text-muted-foreground">Coordinator: {shift.coordinator}</p>
                  </div>
                </div>

                {isPending && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(shift.id, 'declined')}
                      disabled={loadingId === shift.id}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAction(shift.id, 'accepted')}
                      disabled={loadingId === shift.id}
                      className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {loadingId === shift.id ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      ) : null}
                      Accept
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {shifts.length === 0 && (
        <div className="px-5 py-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <p className="text-sm font-semibold text-foreground">No upcoming shifts</p>
          <p className="text-xs text-muted-foreground mt-1">Your roster will appear here once the admin assigns you to a service.</p>
        </div>
      )}
    </div>
  );
}