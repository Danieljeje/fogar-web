'use client';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { prayerService, PrayerRequest } from '@/services/prayerService'; // ADJUST PATH if your alias differs

interface PrayerFormData {
  title: string;
  body: string;
  isPrivate: boolean;
}

// NOTE: the "🙏 Pray (count)" intercession feature and the "Answered"/"Archived"
// statuses from the old fake data aren't backed by anything on the server yet
// — there's no intercession-count endpoint and no answered/archived concept on
// PrayerRequest (only PENDING/APPROVED/REJECTED). Stripped for now, matching
// what you decided for MemberManagementTable's fake fields. Add a real
// intercede endpoint + counter column later if you want that feature back.
const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending Review', className: 'badge-warning' },
  APPROVED: { label: 'Approved', className: 'badge-success' },
  REJECTED: { label: 'Rejected', className: 'badge-danger' },
};

function formatPrayerDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface Props {
  prayerModalOpen: boolean;
  onClosePrayerModal: () => void;
}

export default function PrayerVaultSection({ prayerModalOpen, onClosePrayerModal }: Props) {
  const [myPrayers, setMyPrayers] = useState<PrayerRequest[]>([]);
  const [globalPrayers, setGlobalPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'mine' | 'global'>('mine');
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PrayerFormData>({ defaultValues: { title: '', body: '', isPrivate: false } });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadPrayers();
  }, []);

  async function loadPrayers() {
    setLoading(true);
    try {
      const [mine, global] = await Promise.all([
        prayerService.getMyPrayers(),
        prayerService.getPublicWall(),
      ]);
      setMyPrayers(mine);
      setGlobalPrayers(global);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load prayer requests.');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmitPrayer = async (data: PrayerFormData) => {
    setSubmitting(true);
    try {
      const newPrayer = await prayerService.submitPrayer({
        title: data.title,
        message: data.body,
        isPrivate: data.isPrivate,
      });
      setMyPrayers((prev) => [newPrayer, ...prev]);
      form.reset();
      onClosePrayerModal();
      toast.success('Prayer request submitted — pending admin approval 🙏');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit prayer request.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayedPrayers = activeTab === 'mine' ? myPrayers : globalPrayers;

  return (
    <>
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-foreground">Prayer Vault</h2>
            <p className="text-[11px] text-muted-foreground">Prayer requests & intercession</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {([['mine', 'My Requests'], ['global', 'Global Wall']] as const).map(([tab, label]) => (
            <button
              key={`ptab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === tab ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {label}
              <span className="ml-1.5 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                {tab === 'mine' ? myPrayers.length : globalPrayers.length}
              </span>
            </button>
          ))}
        </div>

        {loading && (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">Loading…</div>
        )}

        {!loading && (
          <div className="divide-y divide-border max-h-72 overflow-y-auto scrollbar-thin">
            {displayedPrayers.map((prayer) => {
              const sc = statusConfig[prayer.status];
              return (
                <div key={prayer.id} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold text-foreground leading-snug flex-1">{prayer.title}</p>
                    <span className={`${sc.className} text-[9px] shrink-0`}>{sc.label}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{prayer.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {activeTab === 'global' && `By: ${prayer.user.firstName} ${prayer.user.lastName} · `}
                        {formatPrayerDate(prayer.createdAt)}
                      </span>
                      {prayer.private && <span className="badge-neutral text-[9px]">🔒 Private</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {displayedPrayers.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-xs font-semibold text-foreground">No prayer requests yet</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {activeTab === 'mine'
                    ? 'Submit your first prayer request using the button above.'
                    : 'Approved requests from the church will appear here.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prayer Modal */}
      {prayerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={onClosePrayerModal} />
          <div className="relative bg-card rounded-2xl shadow-card-lg w-full max-w-md p-6 fade-in">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-foreground">Submit Prayer Request</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Your request will go to the Prayer Vault</p>
              </div>
              <button onClick={onClosePrayerModal} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={form.handleSubmit(handleSubmitPrayer)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Prayer Title</label>
                <input
                  type="text"
                  placeholder="e.g. Healing for my father"
                  className={`input-field ${form.formState.errors.title ? 'border-red-400' : ''}`}
                  {...form.register('title', { required: 'Please give your request a title' })}
                />
                {form.formState.errors.title && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.title.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Prayer Details</label>
                <p className="text-xs text-muted-foreground mb-1.5">Describe what you need the church to pray about</p>
                <textarea
                  rows={4}
                  placeholder="Share the details of your prayer request…"
                  className={`input-field resize-none ${form.formState.errors.body ? 'border-red-400' : ''}`}
                  {...form.register('body', { required: 'Please describe your prayer request', minLength: { value: 20, message: 'Please provide more detail (at least 20 characters)' } })}
                />
                {form.formState.errors.body && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.body.message}</p>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded" {...form.register('isPrivate')} />
                  <div>
                    <span className="text-sm font-medium text-foreground">Keep this request private</span>
                    <p className="text-xs text-muted-foreground">Stays off the public wall even after approval — admins still see it for moderation</p>
                  </div>
                </label>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClosePrayerModal} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? (
                    <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Submitting…</>
                  ) : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}