import React from 'react';
export const dynamic = 'force-dynamic';
import AppLayout from '@/components/AppLayout';
import AdminPanelContent from './components/AdminPanelContent';

export default function AdminPanelPage() {
  return (
    <AppLayout>
  <AdminPanelContent />
</AppLayout>
  );
}