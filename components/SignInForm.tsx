'use client';

import { useEffect, useState } from 'react';
import { sendSignInLink, supabase, verifyCode } from '@/lib/supabase';

type Props = {
  canSend?: () => boolean;
  onSignedIn?: () => void;
  /** Only send links to emails that already have an account. */
  existingOnly?: boolean;
};

export function SignInForm({ canSend = () => true, onSignedIn, existingOnly = false }: Props) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email');
  const [showCode, setShowCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // While waiting, a link opened in another tab signs this one in too, so move on by ourselves.
  useEffect(() => {
    if (step !== 'code') return;
    const sb = supabase();
    if (!sb) return;
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setStep('done');
        onSignedIn?.();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [step, onSignedIn]);

  const send = async () => {
    setBusy(true);
    setError(null);
    const problem = await sendSignInLink(email.trim(), !existingOnly);
    setBusy(false);
    if (problem) setError(problem);
    else setStep('code');
  };

  if (step === 'done') {
    return (
      <div className="note good" role="status">
        <strong>You&apos;re signed in</strong>
        <span>as {email}</span>
      </div>
    );
  }

  if (step === 'code') {
    return (
      <form
        className="stack"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError(null);
          const problem = await verifyCode(email.trim(), code.trim());
          setBusy(false);
          if (problem) {
            setError(problem);
          } else {
            setStep('done');
            onSignedIn?.();
          }
        }}
      >
        <div className="note good" role="status">
          <strong>Check your email</strong>
          <span>We sent a sign-in link to {email}. Tap it and you&apos;re in. It can take a minute to arrive.</span>
        </div>
        {!showCode && (
          <button className="link" type="button" onClick={() => setShowCode(true)}>
            Got a code instead?
          </button>
        )}
        {showCode && (
        <>
        <label className="field">
          <span>Code from the email</span>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6,10}"
            maxLength={10}
            placeholder="123456"
          />
        </label>
        {error && <p className="warn" role="alert">{error}</p>}
        <button className="button primary big" type="submit" disabled={busy}>
          {busy ? 'Checking...' : 'Sign in'}
        </button>
        </>
        )}
        <button className="link" type="button" disabled={busy} onClick={send}>
          Send a new link
        </button>
        <button className="link back" type="button" onClick={() => { setStep('email'); setCode(''); setError(null); }}>
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend()) send();
      }}
    >
      <label className="field">
        <span>Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </label>
      {error && <p className="warn" role="alert">{error}</p>}
      <button className="button primary big" type="submit" disabled={busy}>
        {busy ? 'Sending...' : 'Email me a sign-in link'}
      </button>
    </form>
  );
}
