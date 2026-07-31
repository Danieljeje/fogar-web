'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { userService, User } from '@/services/userService';
import MemberKPIGrid from './MemberKPIGrid';
import ActivityFeed from './ActivityFeed';
import RosterSchedulePanel from './RosterSchedulePanel';
import SacredArchivePlayer from './SacredArchivePlayer';
import PrayerVaultSection from './PrayerVaultSection';

type ActiveSection = 'overview' | 'roster' | 'prayer' | 'media' | 'profile';

export default function MemberDashboardContent() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as ActiveSection | null;
  const [activeSection, setActiveSection] = useState<ActiveSection>(tabFromUrl || 'overview');
  const [prayerModalOpen, setPrayerModalOpen] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);

  useEffect(() => {
    if (tabFromUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveSection(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    userService.getCurrentUser().then(setProfile).catch((err) => console.error(err));
  }, []);

  const displayName = profile?.firstName || 'there';

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const tabs: { key: ActiveSection; label: string }[] = [
    { key: 'overview', label: 'My Dashboard' },
    { key: 'roster', label: 'My Roster' },
    { key: 'prayer', label: 'Prayer Vault' },
    { key: 'media', label: 'Sermon Archive' },
    { key: 'profile', label: 'My Profile' },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="section-label mb-1">Member Dashboard</p>
          <h1 className="text-2xl font-bold text-foreground">Good morning, {displayName} </h1>
          <p className="text-muted-foreground text-sm mt-1">{today}</p>
        </div>
        {activeSection === 'prayer' && (
          <button onClick={() => setPrayerModalOpen(true)} className="btn-primary text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Submit Prayer Request
          </button>
        )}
      </div>

      
      <div className="flex items-center gap-0 bg-muted rounded-xl p-1 w-full overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => (
          <button
            key={`member-tab-${tab.key}`}
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

      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <MemberKPIGrid />
          </div>
          <div>
            <ActivityFeed />
          </div>
        </div>
      )}
      {activeSection === 'roster' && <RosterSchedulePanel />}
      {activeSection === 'prayer' && (
        <PrayerVaultSection
          prayerModalOpen={prayerModalOpen}
          onClosePrayerModal={() => setPrayerModalOpen(false)}
        />
      )}
      {activeSection === 'media' && <SacredArchivePlayer />}
      {activeSection === 'profile' && <ProfileSection profile={profile} />}
    </div>
  );
}

function ProfileSection({ profile }: { profile: User | null }) {
  if (!profile) {
    return <div className="card p-8 text-center text-sm text-muted-foreground">Loading profile…</div>;
  }

  return (
    <div className="card p-6 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-white text-lg font-bold">
          {profile.firstName.charAt(0)}
        </div>
        <div>
          <p className="text-base font-bold text-foreground">{profile.firstName} {profile.lastName}</p>
          <p className="text-xs text-muted-foreground">{profile.role}</p>
        </div>
      </div>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="text-foreground font-medium">{profile.email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Phone</dt>
          <dd className="text-foreground font-medium">{profile.phone}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Department</dt>
          <dd className="text-foreground font-medium">{profile.department}</dd>
        </div>
      </dl>
    </div>
  );
}