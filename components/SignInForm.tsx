'use client';

import { useState } from 'react';
import { sendSignInLink } from '@/lib/supabase';

type Props = { canSend?: () => boolean };

export function SignInForm({ canSend = () => true }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  if (status === 'sent') {
    return (
      <div className="note good" role="status">
        <strong>Check your email</strong>
        <span>We sent a sign-in link to {email}. Open it in this same browser.</span>
      </div>
    );
  }

  return (
    <form
      className="stack"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!canSend()) return;
        setStatus('sending');
        setError(null);
        const problem = await sendSignInLink(email.trim());
        if (problem) {
          setError(problem);
          setStatus('idle');
        } else {
          setStatus('sent');
        }
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
      <button className="button primary big" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending...' : 'Email me a sign-in link'}
      </button>
    </form>
  );
}
