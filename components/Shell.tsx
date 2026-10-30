'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { ChartIcon, ListIcon, MicIcon } from './Icons';
import { APP_NAME } from '@/lib/brand';
import { readSettings } from '@/lib/store';

const TABS = [
  { href: '/', label: 'Hoy', icon: MicIcon },
  { href: '/questions', label: 'Preguntas', icon: ListIcon },
  { href: '/progress', label: 'Progreso', icon: ChartIcon },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // Onboarding and the sign-in return page render bare, without the onboarding redirect.
  const onboarding = pathname === '/onboarding' || pathname.startsWith('/auth/');
  const [ready, setReady] = useState(onboarding);

  useEffect(() => {
    if (!onboarding && !readSettings().onboarded) {
      router.replace('/onboarding');
      return;
    }
    setReady(true);
  }, [onboarding, router]);

  if (!ready) return null;
  if (onboarding) return <main className="screen">{children}</main>;

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">{APP_NAME}</span>
        <span className="muted small">Spanish</span>
      </header>
      <main className="content">{children}</main>
      <nav className="tabbar" aria-label="Main">
        {TABS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="tab" aria-current={pathname === href ? 'page' : undefined}>
            <Icon size={22} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
