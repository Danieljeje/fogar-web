'use client';
import React from 'react';
export const dynamic = 'force-dynamic';
import AppLayout from '@/components/AppLayout';
import MessagesSection from '@/app/components/MessagesSection';

export default function MessagesPage() {
  return (
    <AppLayout>
      <div className="space-y-6 fade-in">
        <div>
          <p className="section-label mb-1">Messages</p>
          <h1 className="text-2xl font-bold text-foreground">Conversations</h1>
        </div>
        <MessagesSection />
      </div>
    </AppLayout>
  );
}