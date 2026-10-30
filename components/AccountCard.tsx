'use client';

import { useRouter } from 'next/navigation';
import { SignInForm } from './SignInForm';
import { writeSettings } from '@/lib/store';
import { accountsEnabled, supabase } from '@/lib/supabase';
import { useAccount } from '@/lib/useAccount';

export function AccountCard() {
  const user = useAccount();
  const router = useRouter();

  const signOut = async () => {
    await supabase()?.auth.signOut();
    // Back to the welcome screen. Your clips stay on this device, hidden until you sign back in.
    writeSettings({ onboarded: false });
    router.replace('/onboarding');
  };
  if (!accountsEnabled() || user === undefined) return null;

  return (
    <section className="stack">
      <p className="label">Account</p>
      {user ? (
        <div className="row-card column">
          <span className="small">Signed in as <strong>{user.email}</strong></span>
          <span className="small muted">Your clips live on this device. Signing out hides them until you sign back in here.</span>
          <button className="link" onClick={signOut}>Sign out</button>
        </div>
      ) : (
        <div className="stack">
          <p className="muted small">Sign in so your answers can follow you when posting arrives.</p>
          <SignInForm />
        </div>
      )}
    </section>
  );
}
