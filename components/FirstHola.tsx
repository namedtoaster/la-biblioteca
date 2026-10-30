'use client';

import { Recorder } from './Recorder';
import { dayKey } from '@/lib/days';
import { saveClip } from '@/lib/store';

/** The very first thing on Hoy for a new account: say hola. It becomes your first clip. */
export function FirstHola({ onDone }: { onDone: () => void }) {
  return (
    <div className="stack">
      <div className="stack tight">
        <h1 className="title">Let&apos;s hear you.</h1>
        <p className="lead">Tap the mic and say <span lang="es">&quot;Hola, me llamo...&quot;</span> and your name.</p>
      </div>
      <Recorder
        idleHint="Your browser will ask to use the microphone. Only you will hear this."
        saveLabel="Keep it as my first clip"
        onSave={async (take) => {
          await saveClip({ kind: 'first', day: dayKey(), questionId: null, durationMs: take.durationMs, audio: take.blob });
          onDone();
        }}
        secondaryLabel="Skip to today's question"
        onSecondary={onDone}
      />
      <p className="muted small center">Later you can play it next to your newest answer and hear how far you&apos;ve come.</p>
    </div>
  );
}
