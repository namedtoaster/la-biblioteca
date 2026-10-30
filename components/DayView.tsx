'use client';

import { useCallback, useEffect, useState } from 'react';
import { ClipPlayer } from './ClipPlayer';
import { GroupFeed } from './GroupFeed';
import { JoinGroup } from './JoinGroup';
import { Recorder } from './Recorder';
import { formatDay } from '@/lib/days';
import { questionFor } from '@/lib/questions';
import { postAnswer } from '@/lib/groups';
import { type Clip, listClips, saveClip } from '@/lib/store';
import { accountsEnabled } from '@/lib/supabase';
import type { Take } from '@/lib/useRecorder';
import { useGroup } from '@/lib/useGroup';

type Props = { day: string; isToday: boolean };

export function DayView({ day, isToday }: Props) {
  const question = questionFor(day);
  const [showHint, setShowHint] = useState(false);
  const [answers, setAnswers] = useState<Clip[]>([]);
  const [recording, setRecording] = useState(false);
  const [justSaved, setJustSaved] = useState<'private' | 'posted' | null>(null);
  const [feedVersion, setFeedVersion] = useState(0);
  const { group, refresh } = useGroup();
  // Answers go to the group only for today's question, while you're in a group.
  const canPost = Boolean(group) && isToday;

  const keepPrivately = async (take: Take) =>
    saveClip({ kind: 'answer', day, questionId: question.id, durationMs: take.durationMs, audio: take.blob });

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
      {justSaved === 'private' && (
        <div className="note" role="status">
          Saved to your journal. Only you can hear it.
        </div>
      )}
      {justSaved === 'posted' && (
        <div className="note good" role="status">
          <strong>Posted to your group.</strong>
          <span>Now listen to the others and reply to a couple. It&apos;s what keeps everyone coming back.</span>
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
          saveLabel={canPost ? 'Post to my group' : 'Save to my journal'}
          onSave={async (take) => {
            if (canPost && group) await postAnswer(group.id, day, question.id, take);
            await keepPrivately(take);
            setRecording(false);
            setJustSaved(canPost ? 'posted' : 'private');
            setFeedVersion((v) => v + 1);
            load();
            if (canPost) refresh();
          }}
          altSaveLabel={canPost ? 'Keep it private' : undefined}
          onAltSave={async (take) => {
            await keepPrivately(take);
            setRecording(false);
            setJustSaved('private');
            load();
          }}
          secondaryLabel="Cancel"
          onSecondary={() => setRecording(false)}
        />
      ) : (
        <>
          <button className="button primary big" onClick={() => { setRecording(true); setJustSaved(null); }}>
            {answers.length ? 'Answer again' : 'Answer out loud'}
          </button>
          <p className="muted small center">
            {canPost
              ? 'Practice as many times as you like. Your group only hears the take you post.'
              : 'Practice as many times as you like. Nobody else hears it.'}
          </p>
        </>
      )}

      {group && <GroupFeed day={day} version={feedVersion} />}
      {group === null && isToday && accountsEnabled() && <JoinGroup />}

      {answers.length > 0 && (
        <section className="stack">
          <p className="label">Saved on this device</p>
          {answers.map((clip, i) => (
            <div key={clip.id} className="row-card">
              <ClipPlayer audio={clip.audio} durationMs={clip.durationMs} label={`Your answer ${i + 1}`} />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
