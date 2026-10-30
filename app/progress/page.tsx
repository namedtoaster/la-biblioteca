'use client';

import { useCallback, useEffect, useState } from 'react';
import { AccountCard } from '@/components/AccountCard';
import { ClipPlayer, formatDuration } from '@/components/ClipPlayer';
import { formatDay, weeksShowedUp } from '@/lib/days';
import { type Clip, deleteClip, listClips } from '@/lib/store';

export default function ProgressPage() {
  const [clips, setClips] = useState<Clip[] | null>(null);

  const load = useCallback(() => {
    listClips().then(setClips);
  }, []);

  useEffect(load, [load]);

  if (!clips) return null;

  const spokenMs = clips.reduce((sum, c) => sum + c.durationMs, 0);
  const weeks = weeksShowedUp(clips.map((c) => c.day));
  const first = clips.find((c) => c.kind === 'first') ?? clips[0];
  const latest = clips.length > 1 ? clips[clips.length - 1] : undefined;

  return (
    <div className="stack">
      <h1 className="title">Your Spanish</h1>
      <div className="stats">
        <div className="stat"><strong>{weeks}</strong><span>{weeks === 1 ? 'week' : 'weeks'} you showed up</span></div>
        <div className="stat"><strong>{formatDuration(spokenMs)}</strong><span>time spent speaking</span></div>
        <div className="stat"><strong>{clips.length}</strong><span>{clips.length === 1 ? 'clip' : 'clips'} saved</span></div>
      </div>

      {first && (
        <section className="stack">
          <p className="label">Hear the difference</p>
          <div className="row-card column">
            <span className="small"><strong>Your first clip</strong> · {formatDay(first.day)}</span>
            <ClipPlayer audio={first.audio} durationMs={first.durationMs} label="Your first clip" />
          </div>
          {latest && latest.id !== first.id && (
            <div className="row-card column">
              <span className="small"><strong>Your latest</strong> · {formatDay(latest.day)}</span>
              <ClipPlayer audio={latest.audio} durationMs={latest.durationMs} label="Your latest clip" />
            </div>
          )}
        </section>
      )}

      <p className="muted">No streaks here. Missing a day costs you nothing. Come back whenever.</p>

      {clips.length > 0 && (
        <details className="stack">
          <summary className="link">All clips ({clips.length})</summary>
          <ul className="list">
            {[...clips].reverse().map((clip) => (
              <li key={clip.id} className="row-card column">
                <span className="small muted">
                  {clip.kind === 'first' ? 'First clip' : 'Answer'} · {formatDay(clip.day)} · {formatDuration(clip.durationMs)}
                </span>
                <ClipPlayer audio={clip.audio} durationMs={clip.durationMs} label="Clip" />
                <button
                  className="link danger"
                  onClick={async () => {
                    if (confirm('Delete this clip? This cannot be undone.')) {
                      await deleteClip(clip.id);
                      load();
                    }
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="muted small">Your clips are stored only in this browser. Clearing site data deletes them.</p>
      <AccountCard />
    </div>
  );
}
