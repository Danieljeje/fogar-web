'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../firebase';
import Sidebar from './Sidebar';
import { Menu, Church } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

interface BackendProfile {
  firstName: string;
  lastName: string;
  department: string;
  role: string;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<BackendProfile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const idToken = await user.getIdToken();
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setProfile(data);
          }
        } catch (err) {
          console.error('Failed to fetch profile in AppLayout', err);
        }
      } else {
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const userName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Guest';

  const userDepartment = profile?.department || '';

  const userRole: 'admin' | 'pastor' | 'member' =
    (profile?.role?.toLowerCase() as 'admin' | 'pastor' | 'member') || 'member';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Suspense fallback={null}>
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
          onMobileClose={() => setMobileSidebarOpen(false)}
          userRole={userRole}
          userName={userName}
          userDepartment={userDepartment}
        />
      </Suspense>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-2.5 bg-card border-b border-border">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-4.5 h-4.5 text-foreground" />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center">
              <Church className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-extrabold text-sm text-foreground tracking-widest">FOGAR</span>
          </div>
          <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-[10px] font-bold">
            {userName.charAt(0)}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 xl:px-8 2xl:px-10 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}