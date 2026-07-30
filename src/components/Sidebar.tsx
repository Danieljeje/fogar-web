'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, Calendar, Heart, Play, User, LayoutGrid, Users, Building2, Settings, LogOut, ChevronLeft, X, Church, MessageCircle } from 'lucide-react';
import { prayerService } from '@/services/prayerService'; // ADJUST PATH if your alias differs

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onMobileClose: () => void;
  userRole: 'admin' | 'pastor' | 'member';
  userName: string;
  userDepartment: string;
}

// Member nav badges (Roster: 2, Prayer Vault: 5) are still fake/hardcoded —
// not touched here, since only the admin sidebar badges were flagged.
const memberNavItems = [
  { key: 'nav-dashboard', label: 'My Dashboard', href: '/member-dashboard?tab=overview', icon: Home, badge: null },
  { key: 'nav-roster', label: 'My Roster', href: '/member-dashboard?tab=roster', icon: Calendar, badge: '2' },
  { key: 'nav-prayer', label: 'Prayer Vault', href: '/member-dashboard?tab=prayer', icon: Heart, badge: '5' },
  { key: 'nav-messages', label: 'Messages', href: '/messages', icon: MessageCircle, badge: null },
  { key: 'nav-media', label: 'Sermon Archive', href: '/member-dashboard?tab=media', icon: Play, badge: null },
  { key: 'nav-profile', label: 'My Profile', href: '/member-dashboard?tab=profile', icon: User, badge: null },
];

// NOTE: badges removed from Members ('3' was tied to a status field that no
// longer exists) and Rosters & Schedules ('7' has no backend at all yet).
// Prayer Moderation's badge is now computed live below instead of hardcoded.
const adminNavItemsBase = [
  { key: 'nav-admin-dash', label: 'Admin Dashboard', href: '/admin-panel?tab=overview', icon: LayoutGrid },
  { key: 'nav-members', label: 'Members', href: '/admin-panel?tab=members', icon: Users },
  { key: 'nav-departments', label: 'Departments', href: '/admin-panel?tab=departments', icon: Building2 },
  { key: 'nav-rosters', label: 'Rosters & Schedules', href: '/admin-panel?tab=rosters', icon: Calendar },
  { key: 'nav-prayer-mod', label: 'Prayer Moderation', href: '/admin-panel?tab=prayer', icon: Heart },
  { key: 'nav-messages', label: 'Messages', href: '/messages', icon: MessageCircle },
  { key: 'nav-media-lib', label: 'Media Library', href: '/admin-panel?tab=media', icon: Play },
  { key: 'nav-settings', label: 'System Settings', href: '/admin-panel?tab=settings', icon: Settings },
];

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onMobileClose,
  userRole,
  userName,
  userDepartment,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  const isAdminOrPastor = userRole === 'admin' || userRole === 'pastor';

  const [prayerPendingCount, setPrayerPendingCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isAdminOrPastor) return;
    prayerService
      .getPendingCount()
      .then(setPrayerPendingCount)
      .catch((err) => {
        console.error(err);
        setPrayerPendingCount(null);
      });
  }, [isAdminOrPastor]);

  const navItems = isAdminOrPastor
    ? adminNavItemsBase.map((item) => ({
        ...item,
        badge:
          item.key === 'nav-prayer-mod'
            ? prayerPendingCount !== null
              ? String(prayerPendingCount)
              : null
            : null,
      }))
    : memberNavItems;

  const roleColor = {
    admin: 'bg-red-50 text-red-700 border border-red-200',
    pastor: 'bg-secondary text-secondary-foreground border border-primary/20',
    member: 'bg-amber-50 text-amber-700 border border-amber-200',
  }[userRole];

  const roleLabel = { admin: 'Admin', pastor: 'Pastor', member: 'Member' }[userRole];

  return (
    <aside
      className={[
        'fixed top-0 left-0 h-full z-50 flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out shadow-sm',
        'lg:relative lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        collapsed ? 'w-16' : 'w-64',
      ].join(' ')}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-border h-16 px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <Church className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-extrabold text-base text-foreground tracking-widest">FOGAR</span>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
            <Church className="w-4.5 h-4.5 text-white" />
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-muted transition-colors"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 pt-4">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${roleColor}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {roleLabel}
          </div>
        </div>
      )}

      {/* Nav section label */}
      {!collapsed && (
        <div className="px-4 pt-5 pb-2">
          <p className="section-label">Navigation</p>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const [itemPath, itemQuery] = item.href.split('?');
            const itemTab = itemQuery ? new URLSearchParams(itemQuery).get('tab') : null;
            const isActive = pathname === itemPath && currentTab === itemTab;
            const NavIcon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={[
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    collapsed ? 'justify-center' : '',
                  ].join(' ')}
                >
                  <NavIcon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-muted-foreground group-hover:text-primary'}`} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={[
                            'ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center',
                            isActive ? 'bg-white/25 text-white' : 'bg-primary text-white',
                          ].join(' ')}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && item.badge && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full ring-2 ring-card" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User profile bottom */}
      <div className="border-t border-border p-3">
        {collapsed ? (
          <div className="flex justify-center">
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {userName.charAt(0)}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userDepartment}</p>
            </div>
            <Link href="/" className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Sign out">
              <LogOut className="w-4 h-4 text-muted-foreground hover:text-red-500 transition-colors" />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}