'use client';
import React, { useState, useEffect } from 'react';
import AdminKPIGrid from './AdminKPIGrid';
import MemberManagementTable from './MemberManagementTable';
import RosterCoverageChart from './RosterCoverageChart';
import DepartmentVolunteerChart from './DepartmentVolunteerChart';
import MediaLibraryGrid from './MediaLibraryGrid';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { prayerService, PrayerRequest } from '@/services/prayerService'; // ADJUST PATH if your alias differs
import { userService, User } from '@/services/userService'; // ADJUST PATH if your alias differs

type ActiveSection = 'overview' | 'members' | 'departments' | 'rosters' | 'media' | 'prayer';

export default function AdminPanelContent() {
 const searchParams = useSearchParams();
const tabFromUrl = searchParams.get('tab') as ActiveSection | null;
const [activeSection, setActiveSection] = useState<ActiveSection>(tabFromUrl || 'overview');

useEffect(() => {
  if (tabFromUrl) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveSection(tabFromUrl);
  }
}, [tabFromUrl]);

  const tabs: { key: ActiveSection; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'members', label: 'Members' },
    { key: 'departments', label: 'Departments' },
    { key: 'rosters', label: 'Rosters & Schedules' },
    { key: 'media', label: 'Media Library' },
    { key: 'prayer', label: 'Prayer Moderation' },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="section-label mb-1">Admin Panel</p>
          <h1 className="text-2xl font-bold text-foreground">Church Administration</h1>
          <p className="text-muted-foreground text-sm mt-1">FOGAR Church · Last sync: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <AdminKPIGrid />

      {/* Section tabs */}
      <div className="flex items-center gap-0 bg-muted rounded-xl p-1 w-full overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => (
          <button
            key={`admin-tab-${tab.key}`}
            onClick={() => setActiveSection(tab.key)}
            className={[
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0',
              activeSection === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 gap-6">
          <RosterCoverageChart />
          <DepartmentVolunteerChart />
        </div>
      )}
      {activeSection === 'members' && <MemberManagementTable />}
      {activeSection === 'departments' && <DepartmentsSection />}
      {activeSection === 'rosters' && <RosterManagementSection />}
      {activeSection === 'media' && <MediaLibraryGrid />}
      {activeSection === 'prayer' && <PrayerModerationSection />}
    </div>
  );
}

interface Roster {
  id: string;
  service: string;
  date: string;
  time: string;
  department: string;
  slotsTotal: number;
  slotsFilled: number;
  status: 'open' | 'full' | 'critical';
}

interface CreateRosterForm {
  service: string;
  date: string;
  time: string;
  department: string;
  slotsTotal: string;
}

const emptyRosterForm: CreateRosterForm = {
  service: '',
  date: '',
  time: '',
  department: '',
  slotsTotal: '',
};

const DEPARTMENTS = [
  'Youth Choir',
  'Ushering Unit',
  'Technical Team',
  'Prayer Warriors',
  'Children Ministry',
  'Media Department',
  'Welfare Team',
  'Evangelism Unit',
  'Senior Pastorate',
];

interface DepartmentSummary {
  name: string;
  memberCount: number;
}

function DepartmentsSection() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadDepartments();
  }, []);

  async function loadDepartments() {
    setLoading(true);
    try {
      const [deptList, memberList] = await Promise.all([
        userService.getDepartments(),
        userService.getAllUsers(),
      ]);
      setDepartments(deptList);
      setMembers(memberList);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load departments.');
    } finally {
      setLoading(false);
    }
  }

  // Member counts are computed client-side from the two calls above rather
  // than a dedicated backend aggregate — fine at this scale, but if the
  // member list grows large this should become a real GROUP BY query
  // (e.g. GET /api/users/departments/counts) instead.
  const summaries: DepartmentSummary[] = departments
    .map((name) => ({
      name,
      memberCount: members.filter((m) => m.department === name).length,
    }))
    .sort((a, b) => b.memberCount - a.memberCount);

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-base font-bold text-foreground">Departments</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {summaries.length} department{summaries.length !== 1 ? 's' : ''} · {members.length} total members across all departments
          </p>
        </div>
      </div>

      {loading && (
        <div className="py-16 flex items-center justify-center text-sm text-muted-foreground">
          Loading departments…
        </div>
      )}

      {!loading && summaries.length === 0 && (
        <div className="py-16 flex items-center justify-center text-sm text-muted-foreground">
          No departments yet — they show up here once members are assigned to one.
        </div>
      )}

      {!loading && summaries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
          {summaries.map((dept) => (
            <div key={dept.name} className="rounded-xl border border-border p-4">
              <p className="text-sm font-semibold text-foreground">{dept.name}</p>
              <p className="text-2xl font-bold text-foreground mt-2">{dept.memberCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                member{dept.memberCount !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RosterManagementSection() {
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<CreateRosterForm>(emptyRosterForm);
  const [formErrors, setFormErrors] = useState<Partial<CreateRosterForm>>({});
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const statusConfig: Record<string, { label: string; className: string }> = {
    open: { label: 'Open', className: 'badge-info' },
    full: { label: 'Fully Staffed', className: 'badge-success' },
    critical: { label: 'Critical', className: 'badge-danger' },
  };

  const validateForm = (): boolean => {
    const errors: Partial<CreateRosterForm> = {};
    if (!form.service.trim()) errors.service = 'Service name is required';
    if (!form.date) errors.date = 'Date is required';
    if (!form.time) errors.time = 'Time is required';
    if (!form.department) errors.department = 'Department is required';
    if (!form.slotsTotal) {
      errors.slotsTotal = 'Number of slots is required';
    } else if (isNaN(Number(form.slotsTotal)) || Number(form.slotsTotal) < 1) {
      errors.slotsTotal = 'Enter a valid number of slots (minimum 1)';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setCreateLoading(true);
    // BACKEND INTEGRATION: POST /api/rosters with roster data — Rosters &
    // Schedules is not in the current phase plan yet, still fake for now.
    await new Promise((r) => setTimeout(r, 700));
    const slots = Number(form.slotsTotal);
    const newRoster: Roster = {
      id: `roster-${Date.now()}`,
      service: form.service.trim(),
      date: form.date,
      time: form.time,
      department: form.department,
      slotsTotal: slots,
      slotsFilled: 0,
      status: 'open',
    };
    setRosters((prev) => [newRoster, ...prev]);
    setCreateLoading(false);
    setShowCreateModal(false);
    setForm(emptyRosterForm);
    setFormErrors({});
    toast.success(`Roster created for ${form.department}!`);
  };

  const handleDelete = async (id: string) => {
    setRosters((prev) => prev.filter((r) => r.id !== id));
    setDeleteConfirmId(null);
    toast.success('Roster deleted.');
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setForm(emptyRosterForm);
    setFormErrors({});
  };

  return (
    <>
      {/* Create Roster Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Create New Roster</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Set up a volunteer roster for an upcoming service</p>
              </div>
              <button onClick={handleCloseModal} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Service Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Sunday First Service"
                  value={form.service}
                  onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                  className={`input-field text-sm ${formErrors.service ? 'border-red-400' : ''}`}
                />
                {formErrors.service && <p className="mt-1 text-xs text-red-500">{formErrors.service}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className={`input-field text-sm ${formErrors.date ? 'border-red-400' : ''}`}
                  />
                  {formErrors.date && <p className="mt-1 text-xs text-red-500">{formErrors.date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Time <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className={`input-field text-sm ${formErrors.time ? 'border-red-400' : ''}`}
                  />
                  {formErrors.time && <p className="mt-1 text-xs text-red-500">{formErrors.time}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Department <span className="text-red-500">*</span></label>
                <select
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  className={`input-field text-sm ${formErrors.department ? 'border-red-400' : ''}`}
                >
                  <option value="">Select department…</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={`roster-dept-${d}`} value={d}>{d}</option>
                  ))}
                </select>
                {formErrors.department && <p className="mt-1 text-xs text-red-500">{formErrors.department}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Number of Volunteer Slots <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 8"
                  value={form.slotsTotal}
                  onChange={(e) => setForm((f) => ({ ...f, slotsTotal: e.target.value }))}
                  className={`input-field text-sm ${formErrors.slotsTotal ? 'border-red-400' : ''}`}
                />
                {formErrors.slotsTotal && <p className="mt-1 text-xs text-red-500">{formErrors.slotsTotal}</p>}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={handleCloseModal} className="btn-secondary text-sm">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={createLoading}
                className="btn-primary text-sm"
              >
                {createLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Create Roster
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">Roster Management</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{rosters.length} roster{rosters.length !== 1 ? 's' : ''} created</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create Roster
          </button>
        </div>

        {rosters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">No rosters yet</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs">
              Create your first volunteer roster for an upcoming service.
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Create First Roster
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Service', 'Date', 'Time', 'Department', 'Slots Filled', 'Coverage', 'Status', 'Actions'].map((h) => (
                    <th key={`rh-${h}`} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rosters.map((r) => {
                  const sc = statusConfig[r.status];
                  const pct = Math.round((r.slotsFilled / r.slotsTotal) * 100);
                  return (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3 font-medium text-foreground text-xs whitespace-nowrap">{r.service}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{r.date}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{r.time}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{r.department}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">{r.slotsFilled}/{r.slotsTotal}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold tabular-nums">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={`${sc.className} text-[10px]`}>{sc.label}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {deleteConfirmId === r.id ? (
                            <>
                              <button onClick={() => handleDelete(r.id)} className="px-2 py-1 rounded-md bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition-colors">Confirm</button>
                              <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-[10px] font-bold hover:bg-muted/80 transition-colors">Cancel</button>
                            </>
                          ) : (
                            <button onClick={() => setDeleteConfirmId(r.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors" title="Delete roster">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function formatPrayerDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function PrayerModerationSection() {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadPrayers();
  }, []);

  async function loadPrayers() {
    setLoading(true);
    try {
      const data = await prayerService.getAllForModeration();
      setPrayers(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load prayer requests.');
    } finally {
      setLoading(false);
    }
  }

  const handleModerate = async (id: number, action: 'approve' | 'reject') => {
    try {
      const updated = action === 'approve'
        ? await prayerService.approve(id)
        : await prayerService.reject(id);
      setPrayers((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success(action === 'approve' ? 'Prayer request approved.' : 'Prayer request rejected.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update prayer request.');
    }
  };

  const statusCfg: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pending Review', className: 'badge-warning' },
    APPROVED: { label: 'Approved', className: 'badge-success' },
    REJECTED: { label: 'Rejected', className: 'badge-danger' },
  };

  const pendingCount = prayers.filter((p) => p.status === 'PENDING').length;

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-base font-bold text-foreground">Prayer Request Moderation</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Review and approve prayer requests before they appear on the public wall</p>
        </div>
        {!loading && <span className="badge-warning">{pendingCount} awaiting review</span>}
      </div>

      {loading && (
        <div className="py-16 flex items-center justify-center text-sm text-muted-foreground">
          Loading prayer requests…
        </div>
      )}

      {!loading && prayers.length === 0 && (
        <div className="py-16 flex items-center justify-center text-sm text-muted-foreground">
          No prayer requests submitted yet.
        </div>
      )}

      {!loading && prayers.length > 0 && (
        <div className="divide-y divide-border">
          {prayers.map((p) => {
            const sc = statusCfg[p.status];
            return (
              <div key={p.id} className="px-5 py-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-foreground">{p.title}</p>
                      <span className={`${sc.className} text-[10px]`}>{sc.label}</span>
                      {p.private && <span className="badge-neutral text-[10px]">🔒 Private</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      By: {p.user.firstName} {p.user.lastName} · {formatPrayerDate(p.createdAt)}
                    </p>
                    <p className="text-xs text-foreground leading-relaxed line-clamp-2">{p.message}</p>
                  </div>
                  {p.status === 'PENDING' && (
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button onClick={() => handleModerate(p.id, 'approve')} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors border border-emerald-200">
                        Approve
                      </button>
                      <button onClick={() => handleModerate(p.id, 'reject')} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors border border-red-200">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}