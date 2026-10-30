'use client';

import { useCallback, useEffect, useState } from 'react';
import { ClipPlayer, formatDuration } from './ClipPlayer';
import { Recorder } from './Recorder';
import { formatDay } from '@/lib/days';
import { questionFor } from '@/lib/questions';
import { type Clip, listClips, saveClip } from '@/lib/store';

type Props = { day: string; isToday: boolean };

export function DayView({ day, isToday }: Props) {
  const question = questionFor(day);
  const [showHint, setShowHint] = useState(false);
  const [answers, setAnswers] = useState<Clip[]>([]);
  const [recording, setRecording] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const load = useCallback(async () => {
    const all = await listClips();
    setAnswers(all.filter((c) => c.kind === 'answer' && c.day === day));
  }, [day]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="stack">
      {isToday && answers.length === 0 && !recording && (
        <div className="note good">
          <strong>Answer today&apos;s question</strong>
          <span>Say anything. Short and messy is perfect.</span>
        </div>
      )}
      {justSaved && (
        <div className="note" role="status">
          Saved to your journal. Only you can hear it. Soon you&apos;ll be able to post answers so other learners can reply.
        </div>
      )}

      <p className="label">{isToday ? "Today's question" : formatDay(day)}</p>
      <section className="card">
        <h1 className="question" lang="es">{question.text}</h1>
        {showHint && <p className="muted">{question.hint}</p>}
        <button className="link" onClick={() => setShowHint(!showHint)} aria-expanded={showHint}>
          {showHint ? 'Hide English' : 'Show in English'}
        </button>
        <div className="chips" lang="es">
          {question.words.map((w) => (
            <span key={w} className="chip">{w}</span>
          ))}
        </div>
      </section>

      {recording ? (
        <Recorder
          idleHint="Tap and talk. Mistakes are fine."
          saveLabel="Save to my journal"
          onSave={async (take) => {
            await saveClip({ kind: 'answer', day, questionId: question.id, durationMs: take.durationMs, audio: take.blob });
            setRecording(false);
            setJustSaved(true);
            load();
          }}
          secondaryLabel="Cancel"
          onSecondary={() => setRecording(false)}
        />
      ) : (
        <>
          <button className="button primary big" onClick={() => { setRecording(true); setJustSaved(false); }}>
            {answers.length ? 'Answer again' : 'Answer out loud'}
          </button>
          <p className="muted small center">Practice as many times as you like. Nobody else hears it.</p>
        </>
      )}

      {answers.length > 0 && (
        <section className="stack">
          <p className="label">Your answers</p>
          {answers.map((clip, i) => (
            <div key={clip.id} className="row-card">
              <ClipPlayer audio={clip.audio} durationMs={clip.durationMs} label={`Your answer ${i + 1}`} />
              <span className="muted small">{formatDuration(clip.durationMs)}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
