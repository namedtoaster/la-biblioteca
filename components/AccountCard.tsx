'use client';

import { SignInForm } from './SignInForm';
import { accountsEnabled, supabase } from '@/lib/supabase';
import { useAccount } from '@/lib/useAccount';

export function AccountCard() {
  const user = useAccount();
  if (!accountsEnabled() || user === undefined) return null;

  return (
    <section className="stack">
      <p className="label">Account</p>
      {user ? (
        <div className="row-card column">
          <span className="small">Signed in as <strong>{user.email}</strong></span>
          <span className="small muted">Your clips still live only on this device. Posting them is coming next.</span>
          <button className="link" onClick={() => supabase()?.auth.signOut()}>Sign out</button>
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
