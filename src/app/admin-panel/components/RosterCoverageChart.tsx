'use client';
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { week: '01 Jun', coverage: 88, target: 90 },
  { week: '08 Jun', coverage: 91, target: 90 },
  { week: '15 Jun', coverage: 79, target: 90 },
  { week: '22 Jun', coverage: 85, target: 90 },
  { week: '29 Jun', coverage: 82, target: 90 },
  { week: '06 Jul', coverage: 76, target: 90 },
  { week: '13 Jul', coverage: 73, target: 90 },
  { week: '15 Jul', coverage: 73, target: 90 },
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2.5 shadow-card-md text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={`tt-${i}`} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold text-foreground tabular-nums">{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

export default function RosterCoverageChart() {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Volunteer Coverage Rate</h2>
          <p className="text-xs text-muted-foreground mt-0.5">8-week trend vs 90% target</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-primary rounded-full inline-block" />
            <span className="text-xs text-muted-foreground">Coverage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-400 rounded-full inline-block border-dashed" />
            <span className="text-xs text-muted-foreground">Target</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="coverageGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.1} />
              <stop offset="95%" stopColor="var(--warning)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
          <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="target" stroke="var(--warning)" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#targetGrad)" name="target" dot={false} />
          <Area type="monotone" dataKey="coverage" stroke="var(--primary)" strokeWidth={2} fill="url(#coverageGrad)" name="coverage" dot={{ r: 3, fill: 'var(--primary)', strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-3 flex items-center gap-1.5 p-2.5 rounded-lg bg-red-50 border border-red-100">
        <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
        <p className="text-xs text-red-700 font-medium">Coverage dropped 8% over 6 weeks — 3 departments are below 70% for next Sunday</p>
      </div>
    </div>
  );
}