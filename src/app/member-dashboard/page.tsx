import { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import MemberDashboardContent from './components/MemberDashboardContent';

export default function MemberDashboardPage() {
  return (
    <AppLayout>
      <Suspense fallback={null}>
        <MemberDashboardContent />
      </Suspense>
    </AppLayout>
  );
}