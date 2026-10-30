'use client';

import type { EmailOtpType } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { verifyLink } from '@/lib/supabase';
import { writeSettings } from '@/lib/store';

const TYPES: EmailOtpType[] = ['email', 'magiclink', 'signup'];

// Email links point here with their own token, so they work in any browser or email app.
export default function AuthConfirmPage() {
  const router = useRouter();
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get('token_hash');
    const type = (params.get('type') ?? 'email') as EmailOtpType;
    if (!tokenHash || !TYPES.includes(type)) {
      setProblem('This link is missing its sign-in details.');
      return;
    }
    verifyLink(tokenHash, type).then((error) => {
      if (error) {
        setProblem(error);
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
      <span>You can also sign in with the code from the email, on the Progreso tab.</span>
    </div>
  ) : (
    <p className="muted">Signing you in...</p>
  );
}
