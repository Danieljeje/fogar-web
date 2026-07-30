'use client';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { userService, User } from '@/services/userService'; // ADJUST PATH if your alias differs

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

const roleOptions = ['member', 'pastor', 'admin'] as const;
type UiRole = (typeof roleOptions)[number];

const roleConfig: Record<UiRole, { label: string; className: string }> = {
  admin: { label: 'Admin', className: 'badge-danger' },
  pastor: { label: 'Pastor', className: 'badge-primary' },
  member: { label: 'Member', className: 'badge-neutral' },
};

// Backend stores role as an uppercase String ("ADMIN"/"PASTOR"/"MEMBER").
// These two just convert between that and the lowercase union the UI uses.
function toUiRole(backendRole: string): UiRole {
  const lower = backendRole.toLowerCase();
  return (roleOptions as readonly string[]).includes(lower) ? (lower as UiRole) : 'member';
}
function toBackendRole(uiRole: UiRole): string {
  return uiRole.toUpperCase();
}

interface InviteMemberForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  role: UiRole;
}

const emptyForm: InviteMemberForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: '',
  role: 'member',
};

function formatJoinedDate(createdAt?: string): string {
  if (!createdAt) return '—';
  return new Date(createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function MemberManagementTable() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [roleDropdownId, setRoleDropdownId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(8);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteMemberForm>(emptyForm);
  const [inviteErrors, setInviteErrors] = useState<Partial<Record<keyof InviteMemberForm, string>>>({});
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      setMembers(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load members.');
    } finally {
      setLoading(false);
    }
  }

  const departments = Array.from(new Set([...DEPARTMENTS, ...members.map((m) => m.department)])).sort();

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.department.toLowerCase().includes(q);
    const matchDept = deptFilter === 'all' || m.department === deptFilter;
    return matchSearch && matchDept;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((m) => m.id)));
    }
  };

  const handleRoleChange = async (memberId: number, newRole: UiRole) => {
    setRoleDropdownId(null);
    try {
      const updated = await userService.updateUser(memberId, { role: toBackendRole(newRole) });
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
      toast.success('Role updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update role.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await userService.deleteUser(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setDeleteConfirmId(null);
      toast.success('Member removed from the system.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove member.');
    }
  };

  const validateInviteForm = (): boolean => {
    const errors: Partial<Record<keyof InviteMemberForm, string>> = {};
    if (!inviteForm.firstName.trim()) errors.firstName = 'First name is required';
    if (!inviteForm.lastName.trim()) errors.lastName = 'Last name is required';
    if (!inviteForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email)) {
      errors.email = 'Enter a valid email address';
    } else if (members.some((m) => m.email.toLowerCase() === inviteForm.email.toLowerCase())) {
      errors.email = 'A member with this email already exists';
    }
    if (!inviteForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^0[789][01]\d{8}$/.test(inviteForm.phone)) {
      errors.phone = 'Enter a valid Nigerian phone number (e.g. 08012345678)';
    }
    if (!inviteForm.department) errors.department = 'Please select a department';
    setInviteErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInviteMember = async () => {
    if (!validateInviteForm()) return;
    setInviteLoading(true);
    try {
      const newMember = await userService.inviteMember({
        firstName: inviteForm.firstName.trim(),
        lastName: inviteForm.lastName.trim(),
        email: inviteForm.email.trim().toLowerCase(),
        phone: inviteForm.phone.trim(),
        department: inviteForm.department,
        role: toBackendRole(inviteForm.role),
      });
      setMembers((prev) => [newMember, ...prev]);
      setShowInviteModal(false);
      setInviteForm(emptyForm);
      setInviteErrors({});
      toast.success(`${newMember.firstName} ${newMember.lastName} invited successfully!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to invite member.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowInviteModal(false);
    setInviteForm(emptyForm);
    setInviteErrors({});
  };

  return (
    <>
      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Invite New Member</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  They&apos;ll be linked automatically the first time they sign in with this email.
                </p>
              </div>
              <button onClick={handleCloseModal} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">First Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Adaeze"
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm((f) => ({ ...f, firstName: e.target.value }))}
                    className={`input-field text-sm ${inviteErrors.firstName ? 'border-red-400' : ''}`}
                  />
                  {inviteErrors.firstName && <p className="mt-1 text-xs text-red-500">{inviteErrors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Last Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Okonkwo"
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm((f) => ({ ...f, lastName: e.target.value }))}
                    className={`input-field text-sm ${inviteErrors.lastName ? 'border-red-400' : ''}`}
                  />
                  {inviteErrors.lastName && <p className="mt-1 text-xs text-red-500">{inviteErrors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  placeholder="member@church.ng"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  className={`input-field text-sm ${inviteErrors.email ? 'border-red-400' : ''}`}
                />
                {inviteErrors.email && <p className="mt-1 text-xs text-red-500">{inviteErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  placeholder="08012345678"
                  value={inviteForm.phone}
                  onChange={(e) => setInviteForm((f) => ({ ...f, phone: e.target.value }))}
                  className={`input-field text-sm ${inviteErrors.phone ? 'border-red-400' : ''}`}
                />
                {inviteErrors.phone && <p className="mt-1 text-xs text-red-500">{inviteErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Department / Unit <span className="text-red-500">*</span></label>
                <select
                  value={inviteForm.department}
                  onChange={(e) => setInviteForm((f) => ({ ...f, department: e.target.value }))}
                  className={`input-field text-sm ${inviteErrors.department ? 'border-red-400' : ''}`}
                >
                  <option value="">Select department…</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={`invite-dept-${d}`} value={d}>{d}</option>
                  ))}
                </select>
                {inviteErrors.department && <p className="mt-1 text-xs text-red-500">{inviteErrors.department}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value as UiRole }))}
                  className="input-field text-sm"
                >
                  <option value="member">Member</option>
                  <option value="pastor">Pastor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={handleCloseModal} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleInviteMember} disabled={inviteLoading} className="btn-primary text-sm">
                {inviteLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Inviting…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Invite Member
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {/* Table header controls */}
        <div className="px-5 py-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-foreground">Member Management</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} member{filtered.length !== 1 ? 's' : ''} registered</p>
            </div>
            <button onClick={() => setShowInviteModal(true)} className="btn-primary text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Invite Member
            </button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Search by name, email, department…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="input-field pl-9 text-sm"
              />
            </div>
            <select
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
              className="input-field w-44 text-sm"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={`dept-filter-${d}`} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk action bar — delete only; approve/suspend removed (no status field on backend) */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between px-5 py-2.5 bg-primary/5 border-b border-primary/20 slide-up">
            <p className="text-sm font-semibold text-primary">{selectedIds.size} member{selectedIds.size > 1 ? 's' : ''} selected</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedIds(new Set())} className="btn-ghost text-xs">Clear</button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="py-16 flex items-center justify-center text-sm text-muted-foreground">
            Loading members…
          </div>
        )}

        {/* Empty state */}
        {!loading && members.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">No members yet</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs">
              Start building your church roster by inviting your first member.
            </p>
            <button onClick={() => setShowInviteModal(true)} className="btn-primary text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Invite First Member
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && members.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === paginated.length && paginated.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-border text-primary"
                    />
                  </th>
                  {['Member', 'Email', 'Phone', 'Department', 'Role', 'Joined', 'Actions'].map((h) => (
                    <th key={`mh-${h}`} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((member) => {
                  const uiRole = toUiRole(member.role);
                  const rc = roleConfig[uiRole];
                  return (
                    <tr key={member.id} className={`hover:bg-muted/30 transition-colors group ${selectedIds.has(member.id) ? 'bg-primary/5' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(member.id)}
                          onChange={() => toggleSelect(member.id)}
                          className="w-4 h-4 rounded border-border text-primary"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {member.firstName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">{member.firstName} {member.lastName}</p>
                            {!member.firebaseUid && (
                              <p className="text-[10px] text-amber-600">Invited — not yet signed in</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{member.email}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{member.phone}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{member.department}</td>
                      <td className="px-4 py-3 relative">
                        <button
                          onClick={() => setRoleDropdownId(roleDropdownId === member.id ? null : member.id)}
                          className={`${rc.className} text-[10px] cursor-pointer hover:opacity-80 transition-opacity`}
                        >
                          {rc.label} ▾
                        </button>
                        {roleDropdownId === member.id && (
                          <div className="absolute z-20 top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[110px]">
                            {roleOptions.map((r) => (
                              <button
                                key={`role-opt-${r}`}
                                onClick={() => handleRoleChange(member.id, r)}
                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors ${uiRole === r ? 'font-bold text-primary' : 'text-foreground'}`}
                              >
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatJoinedDate(member.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {deleteConfirmId === member.id ? (
                            <>
                              <button onClick={() => handleDelete(member.id)} className="px-2 py-1 rounded-md bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition-colors">Confirm</button>
                              <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-[10px] font-bold hover:bg-muted/80 transition-colors">Cancel</button>
                            </>
                          ) : (
                            <button onClick={() => setDeleteConfirmId(member.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors" title="Remove member">
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={`page-${p}`}
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${currentPage === p ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}