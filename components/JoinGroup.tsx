'use client';

import { useState } from 'react';
import { joinGroup } from '@/lib/groups';
import { readSettings } from '@/lib/store';
import { useGroup } from '@/lib/useGroup';

// Pattern sources (Mobbin, seen 2026-10-30):
// - "Join Challenge" with dates, then a "Challenge Accepted!" confirmation: Garmin Connect
// - first names on every answer: Tiimo "Question of the day"
export function JoinGroup() {
  const { refresh } = useGroup();
  const [step, setStep] = useState<'pitch' | 'name' | 'joined'>('pitch');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (step === 'joined') {
    return (
      <section className="card stack" role="status">
        <h2 className="title">You&apos;re in.</h2>
        <p className="muted">Your group started. Answer today&apos;s question, then listen to the others and reply to a couple.</p>
        <button className="button primary big" onClick={() => refresh()}>Let&apos;s go</button>
      </section>
    );
  }

  if (step === 'name') {
    return (
      <form
        className="card stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await joinGroup(name.trim(), readSettings().level);
            setStep('joined');
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="title">What should your group call you?</h2>
        <label className="field">
          <span>First name or nickname</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={30} autoComplete="given-name" />
          <span className="muted small">Only your group sees it. No photos, no profiles.</span>
        </label>
        {error && <p className="warn" role="alert">{error}</p>}
        <button className="button primary big" type="submit" disabled={busy || !name.trim()}>
          {busy ? 'Joining...' : 'Join a group'}
        </button>
      </form>
    );
  }

  return (
    <section className="card stack">
      <p className="label">Practice with a small group</p>
      <h2 className="title">Same people, same question, every day for 2 weeks.</h2>
      <ul className="deal">
        <li><strong>Up to 6 learners.</strong><span>You get to know their voices, and they get to know yours.</span></li>
        <li><strong>Answer, listen, reply.</strong><span>By voice, never live. Reply whenever you&apos;re ready.</span></li>
        <li><strong>Safe by design.</strong><span>No profiles or messages. One tap reports anyone, and you never hear them again.</span></li>
      </ul>
      <button className="button primary big" onClick={() => setStep('name')}>Join a group</button>
    </section>
  );
}
