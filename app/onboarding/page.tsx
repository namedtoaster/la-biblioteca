'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Recorder } from '@/components/Recorder';
import { SignInForm } from '@/components/SignInForm';
import { dayKey } from '@/lib/days';
import { readSettings, saveClip, writeSettings, type Settings } from '@/lib/store';
import { accountsEnabled, supabase } from '@/lib/supabase';

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
  const [spoke, setSpoke] = useState(false);
  const [adult, setAdult] = useState(false);
  const [needAdult, setNeedAdult] = useState(false);

  // Anyone already set up or signed in (say, by a link opened in another tab) skips onboarding.
  useEffect(() => {
    if (readSettings().onboarded) {
      router.replace('/');
      return;
    }
    supabase()?.auth.getSession().then(({ data }) => {
      if (data.session) {
        writeSettings({ onboarded: true, adult: true });
        router.replace('/');
      }
    });
  }, [router]);

  const next = () => setStep((s) => Math.min(STEPS, s + 1));
  const level = LEVELS[levelChoice ?? 0].level;

  const finish = () => {
    if (!adult) {
      setNeedAdult(true);
      return;
    }
    writeSettings({ onboarded: true, adult: true, level });
    router.replace('/');
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
          <p className="muted">Enter the email you signed up with and we&apos;ll send you a sign-in link.</p>
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
          <div className="stack tight">
            <h1 className="hero" lang="es">¿Hablamos?</h1>
            <p className="lead">Let&apos;s talk. Tap the mic and say <span lang="es">&quot;hola&quot;</span>.</p>
          </div>
          <div className="grow center-y stack">
            {spoke ? (
              <div className="note good">
                <strong>You just spoke Spanish.</strong>
                <span>That&apos;s the whole idea: a little bit out loud, whenever you&apos;re ready. We kept this clip so you can hear how far you come.</span>
              </div>
            ) : (
              <Recorder
                idleHint="Your browser will ask to use the microphone. Only you will hear this."
                saveLabel="Keep it"
                onSave={async (take) => {
                  await saveClip({ kind: 'first', day: dayKey(), questionId: null, durationMs: take.durationMs, audio: take.blob });
                  setSpoke(true);
                }}
              />
            )}
          </div>
          <div className="stack tight">
            <button className={spoke ? 'button primary big' : 'button ghost'} onClick={next}>
              {spoke ? 'Continue' : 'Not right now'}
            </button>
            {accountsEnabled() && !spoke && (
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
          <h1 className="title">One last thing</h1>
          <label className="check">
            <input type="checkbox" checked={adult} onChange={(e) => { setAdult(e.target.checked); setNeedAdult(false); }} />
            I&apos;m 18 or older
          </label>
          {needAdult && <p className="warn" role="alert">Please confirm you&apos;re 18 or older.</p>}
          <div className="grow stack">
            {accountsEnabled() ? (
              <>
                <p className="muted">Sign in to keep your place when posting arrives. Your clips stay on this device either way.</p>
                <SignInForm
                  onSignedIn={() => router.replace('/')}
                  canSend={() => {
                    if (!adult) setNeedAdult(true);
                    else writeSettings({ onboarded: true, adult: true, level });
                    return adult;
                  }}
                />
              </>
            ) : (
              <p className="muted">Your clips stay only on this device. Nobody else can hear them.</p>
            )}
          </div>
          <button className={accountsEnabled() ? 'button ghost' : 'button primary big'} onClick={finish}>
            {accountsEnabled() ? 'Skip for now and start' : 'Start'}
          </button>
        </div>
      )}
    </div>
  );
}
