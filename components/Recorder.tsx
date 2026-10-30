'use client';

import { useState } from 'react';
import { ClipPlayer, formatDuration } from './ClipPlayer';
import { MicIcon, StopIcon } from './Icons';
import { MAX_SECONDS, type Take, useRecorder } from '@/lib/useRecorder';

type Props = {
  idleHint: string;
  saveLabel: string;
  onSave: (take: Take) => void | Promise<void>;
  /** A second way to keep a finished take, shown under the main button. */
  altSaveLabel?: string;
  onAltSave?: (take: Take) => void | Promise<void>;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function Recorder({ idleHint, saveLabel, onSave, altSaveLabel, onAltSave, secondaryLabel, onSecondary }: Props) {
  const { state, take, takes, seconds, start, stop, reset } = useRecorder();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keep = async (fn: (take: Take) => void | Promise<void>) => {
    if (!take) return;
    setBusy(true);
    setError(null);
    try {
      await fn(take);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <div className="recorder">
        {(state === 'idle' || state === 'denied' || state === 'unsupported') && (
          <>
            <button className="mic" onClick={start} aria-label="Start recording">
              <MicIcon size={40} />
            </button>
            <p className="muted center">{idleHint}</p>
            {state === 'denied' && (
              <p className="warn center" role="alert">
                The microphone is blocked. Allow it in your browser&apos;s site settings, then tap the mic again.
              </p>
            )}
            {state === 'unsupported' && (
              <p className="warn center" role="alert">
                This browser can&apos;t record audio. Try a recent Chrome, Safari or Firefox.
              </p>
            )}
          </>
        )}
        {state === 'recording' && (
          <>
            <button className="mic live" onClick={stop} aria-label="Stop recording">
              <StopIcon size={32} />
            </button>
            <p className="live-text center" aria-live="polite">
              Recording {formatDuration(seconds * 1000)} of {formatDuration(MAX_SECONDS * 1000)}. Tap to stop.
            </p>
          </>
        )}
        {state === 'done' && take && (
          <div className="stack full">
            <ClipPlayer audio={take.blob} durationMs={take.durationMs} label={`Take ${takes}`} />
            <p className="muted center small">
              Take {takes} · {formatDuration(take.durationMs)} · only you can hear this
            </p>
            <button className="button secondary" onClick={reset}>
              Try again
            </button>
          </div>
        )}
      </div>
      {state === 'done' && take && (
        <>
          {error && <p className="warn" role="alert">{error}</p>}
          <button className="button primary" disabled={busy} onClick={() => keep(onSave)}>
            {busy ? 'Saving...' : saveLabel}
          </button>
          {altSaveLabel && onAltSave && (
            <button className="button secondary" disabled={busy} onClick={() => keep(onAltSave)}>
              {altSaveLabel}
            </button>
          )}
        </>
      )}
      {secondaryLabel && onSecondary && state !== 'recording' && (
        <button className="button ghost" onClick={onSecondary}>
          {secondaryLabel}
        </button>
      )}
    </div>
  );
}
