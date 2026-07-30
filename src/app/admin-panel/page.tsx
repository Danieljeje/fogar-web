import React from 'react';
import AppLayout from '@/components/AppLayout';
import AdminPanelContent from './components/AdminPanelContent';

export default function AdminPanelPage() {
  return (
    <AppLayout userRole="admin" userName="Pastor Chukwuemeka Obi" userDepartment="Senior Pastor">
      <AdminPanelContent />
    </AppLayout>
  );
}