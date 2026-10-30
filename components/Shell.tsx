'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { GroupCard } from './GroupCard';
import { ChartIcon, GroupIcon, ListIcon, MicIcon } from './Icons';
import { APP_NAME } from '@/lib/brand';
import { canUseApp } from '@/lib/access';
import { accountsEnabled } from '@/lib/supabase';
import { GroupProvider } from '@/lib/useGroup';

const TABS = [
  { href: '/', label: 'Hoy', icon: MicIcon },
  { href: '/questions', label: 'Preguntas', icon: ListIcon },
  { href: '/group', label: 'Grupo', icon: GroupIcon, needsAccounts: true },
  { href: '/progress', label: 'Progreso', icon: ChartIcon },
];

// Layout: on a phone, a top bar and a bottom tab bar. On a computer, the pattern of community
// web apps (Podia, Circle, Whop on Mobbin): navigation in a left sidebar, the day in a centered
// column, and "Your group" in a right rail.
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // Onboarding and the sign-in return page render bare, without the onboarding redirect.
  const onboarding = pathname === '/onboarding' || pathname.startsWith('/auth/');
  const [ready, setReady] = useState(onboarding);

  useEffect(() => {
    if (onboarding) {
      setReady(true);
      return;
    }
    canUseApp().then((ok) => {
      if (ok) setReady(true);
      else router.replace('/onboarding');
    });
  }, [onboarding, router]);

  if (!ready) return null;
  if (onboarding) return <main className="screen">{children}</main>;

  const tabs = TABS.filter((t) => !t.needsAccounts || accountsEnabled());
  const nav = (className: string) => (
    <nav className={className} aria-label="Main">
      {tabs.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className="tab" aria-current={pathname === href ? 'page' : undefined}>
          <Icon size={22} />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <GroupProvider>
      <div className="app">
        <aside className="sidebar">
          <span className="brand">{APP_NAME}</span>
          <span className="muted small">Spanish</span>
          {nav('sidenav')}
        </aside>
        <header className="topbar">
          <span className="brand">{APP_NAME}</span>
          <span className="muted small">Spanish</span>
        </header>
        <main className="content">{children}</main>
        {pathname !== '/group' && (
          <aside className="rail">
            <GroupCard />
          </aside>
        )}
        {nav('tabbar')}
      </div>
    </GroupProvider>
  );
}
