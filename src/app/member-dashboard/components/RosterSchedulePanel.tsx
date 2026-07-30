'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { shiftService, Shift } from '@/services/shiftService'; // ADJUST PATH if your alias differs

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'badge-warning' },
  ACCEPTED: { label: 'Accepted', className: 'badge-success' },
  DECLINED: { label: 'Declined', className: 'badge-danger' },
};

function formatDateParts(serviceDate: string): { day: string; month: string } {
  const d = new Date(serviceDate);
  return {
    day: d.toLocaleDateString('en-GB', { day: '2-digit' }),
    month: d.toLocaleDateString('en-GB', { month: 'short' }),
  };
}

export default function RosterSchedulePanel() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadShifts();
  }, []);

  async function loadShifts() {
    setLoading(true);
    try {
      const data = await shiftService.getMine();
      setShifts(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load your roster.');
    } finally {
      setLoading(false);
    }
  }

  const handleRespond = async (id: number, status: 'ACCEPTED' | 'DECLINED') => {
    setRespondingId(id);
    try {
      const updated = await shiftService.respond(id, status);
      setShifts((prev) => prev.map((s) => (s.id === id ? updated : s)));
      toast.success(status === 'ACCEPTED' ? 'Shift accepted!' : 'Shift declined.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update shift.');
    } finally {
      setRespondingId(null);
    }
  };

  const pendingCount = shifts.filter((s) => s.status === 'PENDING').length;

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-base font-bold text-foreground">My Roster & Schedules</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Upcoming service shifts assigned to you</p>
        </div>
        {!loading && <span className="badge-primary">{pendingCount} pending</span>}
      </div>

      {loading && (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">Loading your roster…</div>
      )}

      {!loading && (
        <div className="divide-y divide-border">
          {shifts.map((shift) => {
            const sc = statusConfig[shift.status];
            const isPending = shift.status === 'PENDING';
            const { day, month } = formatDateParts(shift.serviceDate);
            return (
              <div key={shift.id} className="px-5 py-4 hover:bg-muted/30 transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-indigo-600 leading-none">{day}</span>
                      <span className="text-[9px] text-indigo-400 leading-none mt-0.5">{month}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{shift.serviceType}</p>
                        <span className={`${sc.className} text-[10px]`}>{sc.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {shift.serviceTime} · {shift.role}{shift.venue ? ` · ${shift.venue}` : ''}
                      </p>
                      {shift.coordinator && (
                        <p className="text-xs text-muted-foreground">Coordinator: {shift.coordinator}</p>
                      )}
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleRespond(shift.id, 'DECLINED')}
                        disabled={respondingId === shift.id}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleRespond(shift.id, 'ACCEPTED')}
                        disabled={respondingId === shift.id}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {respondingId === shift.id ? (
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
      )}

      {!loading && shifts.length === 0 && (
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