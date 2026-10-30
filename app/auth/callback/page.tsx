'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { writeSettings } from '@/lib/store';
import { supabase } from '@/lib/supabase';

// Supabase's email link lands here with the session in the URL. The client reads it on start.
export default function AuthCallbackPage() {
  const router = useRouter();
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const sb = supabase();
    const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search);
    const error = params.get('error_description');
    if (error) {
      setProblem(/expired|invalid/i.test(error) ? 'This link has expired or was already used.' : error);
      return;
    }
    if (!sb) {
      router.replace('/');
      return;
    }
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setProblem('This link has expired or was already used.');
        return;
      }
      // Only adults can request a sign-in, so a working link means onboarding was finished.
      writeSettings({ onboarded: true, adult: true });
      router.replace('/');
    });
  }, [router]);

  return problem ? (
    <div className="note" role="alert">
      <strong>That sign-in link didn&apos;t work</strong>
      <span>{problem}</span>
      <span>Each link works once. Send yourself a new one from the Progreso tab.</span>
    </div>
  ) : (
    <p className="muted">Signing you in...</p>
  );
}
