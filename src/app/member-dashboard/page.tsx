import React from 'react';
export const dynamic = 'force-dynamic';
import AppLayout from '@/components/AppLayout';
import MemberDashboardContent from './components/MemberDashboardContent';

export default function MemberDashboardPage() {
  return (
    <AppLayout>
      <MemberDashboardContent />
    </AppLayout>
  );
}