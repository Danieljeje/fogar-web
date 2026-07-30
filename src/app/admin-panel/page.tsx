import { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import AdminPanelContent from './components/AdminPanelContent';

export default function AdminPanelPage() {
  return (
    <AppLayout>
      <Suspense fallback={null}>
        <AdminPanelContent />
      </Suspense>
    </AppLayout>
  );
}