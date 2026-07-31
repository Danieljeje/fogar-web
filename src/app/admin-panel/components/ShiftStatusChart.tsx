'use client';
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { shiftService, Shift } from '@/services/shiftService';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2.5 shadow-card-md text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={`stt-${i}`} className="flex items-center gap-2">
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold text-foreground tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'var(--warning)',
  ACCEPTED: 'var(--success)',
  DECLINED: 'var(--danger)',
};

export default function ShiftStatusChart() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await shiftService.getAll();
      setShifts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const statusCounts = ['PENDING', 'ACCEPTED', 'DECLINED'].map((status) => ({
    status,
    count: shifts.filter((s) => s.status === status).length,
  }));

  const total = shifts.length;
  const acceptedCount = statusCounts.find((s) => s.status === 'ACCEPTED')?.count ?? 0;
  const acceptedRate = total > 0 ? Math.round((acceptedCount / total) * 100) : 0;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Shift Status Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Current status of all assigned shifts</p>
        </div>
      </div>

      {loading && (
        <div className="py-16 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      )}

      {!loading && total === 0 && (
        <div className="py-16 flex items-center justify-center text-sm text-muted-foreground">
          No shifts assigned yet — assign some in Rosters & Schedules.
        </div>
      )}

      {!loading && total > 0 && (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusCounts} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="status" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Shifts" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {statusCounts.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center gap-1.5 p-2.5 rounded-lg bg-muted/40 border border-border">
            <p className="text-xs text-foreground font-medium">
              {acceptedRate}% of {total} shift{total !== 1 ? 's' : ''} accepted so far
            </p>
          </div>
        </>
      )}
    </div>
  );
}