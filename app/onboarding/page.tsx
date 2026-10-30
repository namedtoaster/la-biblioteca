'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SignInForm } from '@/components/SignInForm';
import { canUseApp } from '@/lib/access';
import { writeSettings, type Settings } from '@/lib/store';
import { accountsEnabled } from '@/lib/supabase';

const STEPS = 4;

// Asked as a situation, not a test, so nobody has to rate themselves.
const LEVELS: { label: string; level: Settings['level'] }[] = [
  { label: '...smile and nod', level: 1 },
  { label: '...catch a few words', level: 1 },
  { label: "...understand, but freeze when it's my turn", level: 2 },
  { label: '...answer back', level: 3 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [returning, setReturning] = useState(false);
  const [levelChoice, setLevelChoice] = useState<number | null>(null);
  const [adult, setAdult] = useState(false);
  const [needAdult, setNeedAdult] = useState(false);

  // Anyone who can already use the app (say, signed in by a link in another tab) skips this.
  useEffect(() => {
    canUseApp().then((ok) => ok && router.replace('/'));
  }, [router]);

  const next = () => setStep((s) => Math.min(STEPS, s + 1));
  const level = LEVELS[levelChoice ?? 0].level;

  const confirmAdult = () => {
    if (!adult) {
      setNeedAdult(true);
      return false;
    }
    writeSettings({ onboarded: true, adult: true, level });
    return true;
  };

  if (returning) {
    return (
      <div className="onboarding">
        <div className="progress-row">
          <button className="icon-button" onClick={() => setReturning(false)} aria-label="Back">
            ←
          </button>
        </div>
        <div className="step">
          <h1 className="title">Welcome back</h1>
          <p className="muted">Enter the email you signed up with and we&apos;ll send you a sign-in code.</p>
          <SignInForm
            existingOnly
            onSignedIn={() => {
              writeSettings({ onboarded: true, adult: true });
              router.replace('/');
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding">
      <div className="progress-row">
        {step > 1 ? (
          <button className="icon-button" onClick={() => setStep(step - 1)} aria-label="Back">
            ←
          </button>
        ) : (
          <span className="icon-spacer" />
        )}
        <ol className="dots" aria-label={`Step ${step} of ${STEPS}`}>
          {Array.from({ length: STEPS }, (_, i) => (
            <li key={i} className={i < step ? 'on' : ''} />
          ))}
        </ol>
        <span className="icon-spacer" />
      </div>

      {step === 1 && (
        <div className="step">
          <div className="grow center-y stack">
            <h1 className="hero" lang="es">¿Hablamos?</h1>
            <p className="lead">Let&apos;s talk. One question a day, answered out loud, at your own pace.</p>
          </div>
          <div className="stack tight">
            <button className="button primary big" onClick={next}>Start</button>
            {accountsEnabled() && (
              <button className="button ghost" onClick={() => setReturning(true)}>
                I already have an account
              </button>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="step">
          <h1 className="title">When someone speaks Spanish to you, you...</h1>
          <div className="stack grow" role="radiogroup" aria-label="When someone speaks Spanish to you">
            {LEVELS.map((option, i) => (
              <button
                key={option.label}
                role="radio"
                aria-checked={levelChoice === i}
                className="choice"
                onClick={() => setLevelChoice(i)}
              >
                {option.label}
              </button>
            ))}
            <p className="muted small">No wrong answer. It only sets how hard the questions start.</p>
          </div>
          <button className="button primary big" onClick={next} disabled={levelChoice === null}>
            Continue
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="step">
          <h1 className="title">Here&apos;s the deal</h1>
          <ul className="deal grow">
            <li>
              <strong>One question a day.</strong>
              <span>About your life, so there&apos;s no wrong answer. It changes every morning.</span>
            </li>
            <li>
              <strong>Answer out loud, as many tries as you want.</strong>
              <span>Nobody hears a take you don&apos;t keep.</span>
            </li>
            <li>
              <strong>No streaks, no hearts, no guilt.</strong>
              <span>Miss a week and nothing is lost. Come back whenever.</span>
            </li>
            <li>
              <strong>Soon: real people answer you.</strong>
              <span>By voice, never live. Every clip is checked first, and one tap blocks anyone.</span>
            </li>
          </ul>
          <button className="button primary big" onClick={next}>Sounds good</button>
        </div>
      )}

      {step === 4 && (
        <div className="step">
          <h1 className="title">{accountsEnabled() ? 'Make your account' : 'One last thing'}</h1>
          <label className="check">
            <input type="checkbox" checked={adult} onChange={(e) => { setAdult(e.target.checked); setNeedAdult(false); }} />
            I&apos;m 18 or older
          </label>
          {needAdult && <p className="warn" role="alert">Please confirm you&apos;re 18 or older.</p>}
          {accountsEnabled() ? (
            <div className="grow stack">
              <p className="muted">No password. We email you a code each time you sign in.</p>
              <SignInForm onSignedIn={() => router.replace('/')} canSend={confirmAdult} />
            </div>
          ) : (
            <>
              <p className="muted grow">Your clips stay only on this device. Nobody else can hear them.</p>
              <button className="button primary big" onClick={() => confirmAdult() && router.replace('/')}>
                Start
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
