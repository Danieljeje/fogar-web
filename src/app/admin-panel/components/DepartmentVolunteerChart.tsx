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
import { userService, User } from '@/services/userService';
import { shiftService, Shift } from '@/services/shiftService';

const COLORS = ['var(--primary)', '#7C3AED', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

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
        <div key={`dtt-${i}`} className="flex items-center gap-2">
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold text-foreground tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DepartmentVolunteerChart() {
  const [data, setData] = useState<{ dept: string; volunteers: number; shifts: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [departments, users, shifts] = await Promise.all([
        userService.getDepartments(),
        userService.getAllUsers(),
        shiftService.getAll(),
      ]);

      const chartData = departments.map((dept: string) => ({
        dept,
        volunteers: users.filter((u: User) => u.department === dept).length,
        shifts: shifts.filter((s: Shift) => s.department === dept).length,
      }));

      setData(chartData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Department Volunteer Counts</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Registered members vs assigned shifts per department</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-primary inline-block" />
            <span className="text-xs text-muted-foreground">Members</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />
            <span className="text-xs text-muted-foreground">Shifts</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="py-16 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      )}

      {!loading && data.length === 0 && (
        <div className="py-16 flex items-center justify-center text-sm text-muted-foreground">
          No departments with members yet.
        </div>
      )}

      {!loading && data.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }} barGap={2}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dept" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="volunteers" name="Members" radius={[4, 4, 0, 0]} maxBarSize={18}>
                {data.map((_, index) => (
                  <Cell key={`cell-vol-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.85} />
                ))}
              </Bar>
              <Bar dataKey="shifts" name="Shifts" radius={[4, 4, 0, 0]} fill="var(--success)" opacity={0.7} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {data.slice(0, 4).map((d, i) => (
              <div key={`dept-stat-${i}`} className="text-center p-2 rounded-lg bg-muted/40">
                <p className="text-xs font-bold text-foreground tabular-nums">{d.volunteers}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{d.dept}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}