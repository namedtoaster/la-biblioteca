'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MicIcon } from '@/components/Icons';
import { Recorder } from '@/components/Recorder';
import { SignInForm } from '@/components/SignInForm';
import { dayKey } from '@/lib/days';
import { saveClip, writeSettings, type Settings } from '@/lib/store';
import { accountsEnabled } from '@/lib/supabase';

const STEPS = 5;

const LEVELS: { label: string; level: Settings['level'] }[] = [
  { label: "I'm brand new to Spanish", level: 1 },
  { label: 'I know lots of words but freeze when I speak', level: 1 },
  { label: 'I can have simple conversations', level: 2 },
  { label: 'I can talk about most things', level: 3 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [returning, setReturning] = useState(false);
  const [levelChoice, setLevelChoice] = useState(1);
  const [firstSaved, setFirstSaved] = useState(false);
  const [adult, setAdult] = useState(false);
  const [needAdult, setNeedAdult] = useState(false);

  const next = () => setStep((s) => Math.min(STEPS, s + 1));

  const finish = () => {
    if (!adult) {
      setNeedAdult(true);
      return;
    }
    writeSettings({ onboarded: true, adult: true, level: LEVELS[levelChoice].level });
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
        {step > 1 && (
          <button className="icon-button" onClick={() => setStep(step - 1)} aria-label="Back">
            ←
          </button>
        )}
        <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step} aria-label="Setup progress">
          <div style={{ width: `${(step / STEPS) * 100}%` }} />
        </div>
      </div>

      {step === 1 && (
        <div className="step">
          <div className="grow center-y stack">
            <div className="badge"><MicIcon size={40} /></div>
            <h1 className="hero">Speak Spanish out loud.</h1>
            <p className="lead">One question a day. Answer it by voice. Nobody hears you until you&apos;re ready.</p>
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
          <h1 className="title">How much Spanish do you know?</h1>
          <div className="stack grow" role="radiogroup" aria-label="Your level">
            {LEVELS.map((option, i) => (
              <button
                key={option.label}
                role="radio"
                aria-checked={levelChoice === i}
                className="choice"
                onClick={() => setLevelChoice(i)}
              >
                <span className="bars" aria-hidden="true">
                  {[0, 1, 2, 3].map((b) => (
                    <span key={b} className={b <= i ? 'on' : ''} style={{ height: 6 + b * 5 }} />
                  ))}
                </span>
                {option.label}
              </button>
            ))}
          </div>
          <button className="button primary big" onClick={next}>Continue</button>
        </div>
      )}

      {step === 3 && (
        <div className="step">
          <h1 className="title">Try it. Say hola and your name.</h1>
          <p className="muted" lang="es">&quot;Hola, me llamo...&quot; This one is just for you.</p>
          <div className="grow">
            {firstSaved ? (
              <div className="note good">
                <strong>That&apos;s it. That&apos;s the whole app.</strong>
                <span>We kept this as your first clip, so you can hear how far you&apos;ve come.</span>
              </div>
            ) : (
              <Recorder
                idleHint="Your browser will ask to use the microphone."
                saveLabel="Keep it"
                onSave={async (take) => {
                  await saveClip({ kind: 'first', day: dayKey(), questionId: null, durationMs: take.durationMs, audio: take.blob });
                  setFirstSaved(true);
                }}
              />
            )}
          </div>
          <button className={firstSaved ? 'button primary big' : 'button ghost'} onClick={next}>
            {firstSaved ? 'Continue' : 'Skip for now'}
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="step">
          <h1 className="title">How it works</h1>
          <ol className="steps grow">
            <li><strong>Answer the day&apos;s question</strong><span>A new one every morning. Practice as many times as you want.</span></li>
            <li><strong>Listen back</strong><span>Your answers are saved, so you can hear yourself improve.</span></li>
            <li><strong>Soon: real people answer you</strong><span>By voice, never live. Every clip is checked first, and one tap blocks anyone.</span></li>
          </ol>
          <button className="button primary big" onClick={next}>Got it</button>
        </div>
      )}

      {step === 5 && (
        <div className="step">
          <h1 className="title">One last thing</h1>
          <label className="check">
            <input type="checkbox" checked={adult} onChange={(e) => { setAdult(e.target.checked); setNeedAdult(false); }} />
            I&apos;m 18 or older
          </label>
          {needAdult && <p className="warn" role="alert">Please confirm you&apos;re 18 or older.</p>}
          <div className="grow stack">
            {accountsEnabled() && (
              <>
                <p className="muted">Sign in to keep your place when posting arrives. Your clips stay on this device either way.</p>
                <SignInForm
                  onSignedIn={() => router.replace('/')}
                  canSend={() => {
                    if (!adult) setNeedAdult(true);
                    else writeSettings({ onboarded: true, adult: true, level: LEVELS[levelChoice].level });
                    return adult;
                  }}
                />
              </>
            )}
            {!accountsEnabled() && (
              <p className="muted">Your clips stay only on this device. Nobody else can hear them.</p>
            )}
          </div>
          <button className={accountsEnabled() ? 'button ghost' : 'button primary big'} onClick={finish}>
            {accountsEnabled() ? 'Skip for now and start speaking' : 'Start speaking'}
          </button>
        </div>
      )}
    </div>
  );
}
