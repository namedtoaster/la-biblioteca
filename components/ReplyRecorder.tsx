'use client';

import { useState } from 'react';
import { ClipPlayer, formatDuration } from './ClipPlayer';
import { MicIcon, StopIcon, TrashIcon } from './Icons';
import { MAX_SECONDS, type Take, useRecorder } from '@/lib/useRecorder';

// Pattern sources (Mobbin, seen 2026-10-30):
// - a "Recording audio 140s" pill with a stop button: X direct messages
// - a trash button beside the recording to throw it away: BeReal chat, Replika
export function ReplyRecorder({ to, onSend }: { to: string; onSend: (take: Take) => Promise<void> }) {
  const { state, take, seconds, start, stop, reset } = useRecorder();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (state === 'recording') {
    return (
      <div className="rec-pill" aria-live="polite">
        <span className="rec-dot" aria-hidden="true" />
        <span className="grow">Recording reply to {to}</span>
        <span className="time">{formatDuration(seconds * 1000)} / {formatDuration(MAX_SECONDS * 1000)}</span>
        <button className="icon-button live" onClick={stop} aria-label="Stop recording"><StopIcon size={20} /></button>
      </div>
    );
  }

  if (state === 'done' && take) {
    return (
      <div className="stack tight reply-preview">
        <div className="reply-row">
          <button className="icon-button" onClick={reset} aria-label="Delete this reply"><TrashIcon /></button>
          <ClipPlayer audio={take.blob} durationMs={take.durationMs} label={`Your reply to ${to}`} />
        </div>
        {error && <p className="warn" role="alert">{error}</p>}
        <button
          className="button primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await onSend(take);
              reset();
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Sending...' : `Send reply to ${to}`}
        </button>
      </div>
    );
  }

  return (
    <div className="stack tight">
      <button className="button secondary reply-button" onClick={start}>
        <MicIcon size={18} /> Reply to {to} by voice
      </button>
      {state === 'denied' && <p className="warn" role="alert">The microphone is blocked. Allow it in your browser&apos;s site settings.</p>}
      {state === 'unsupported' && <p className="warn" role="alert">This browser can&apos;t record audio.</p>}
    </div>
  );
}
