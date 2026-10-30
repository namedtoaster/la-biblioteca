import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Shell } from '@/components/Shell';
import { APP_NAME } from '@/lib/brand';
import './globals.css';

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Speak Spanish out loud. One question a day, answered by voice.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0E7C66',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
