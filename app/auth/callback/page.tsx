'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const sb = supabase();
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error_description');
    if (error) {
      setProblem(error);
      return;
    }
    if (!sb || !code) {
      router.replace('/');
      return;
    }
    sb.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
      if (exchangeError) setProblem(exchangeError.message);
      else router.replace('/');
    });
  }, [router]);

  return (
    <div className="stack">
      {problem ? (
        <div className="note" role="alert">
          <strong>That sign-in link didn&apos;t work</strong>
          <span>{problem}</span>
          <span>Links work once, in the browser where you asked for them. Try sending a new one from Progreso.</span>
        </div>
      ) : (
        <p className="muted">Signing you in...</p>
      )}
    </div>
  );
}
