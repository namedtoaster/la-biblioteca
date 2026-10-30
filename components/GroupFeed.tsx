'use client';

import { useCallback, useEffect, useState } from 'react';
import { ClipPlayer } from './ClipPlayer';
import { FlagIcon } from './Icons';
import { ReplyRecorder } from './ReplyRecorder';
import { ReportSheet } from './ReportSheet';
import { type Answer, type Reply, clipUrls, groupDay, initials, postReply, reportClip } from '@/lib/groups';
import { useGroup } from '@/lib/useGroup';

// Pattern sources (Mobbin, seen 2026-10-30):
// - your answer first, then everyone else's with first name and time: Insight Timer Gratitude Wall,
//   Tiimo "Question of the day"
function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

type Reporting = { name: string; answerId?: string; replyId?: string };

export function GroupFeed({ day, version }: { day: string; version: number }) {
  const { group, refresh } = useGroup();
  const [answers, setAnswers] = useState<Answer[] | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [reporting, setReporting] = useState<Reporting | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await groupDay(day);
      list.sort((a, b) => Number(b.is_mine) - Number(a.is_mine));
      setAnswers(list);
      setUrls(await clipUrls(list.flatMap((a) => [a.path, ...a.replies.map((r) => r.path)])));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [day]);

  useEffect(() => {
    load();
  }, [load, version]);

  if (!group) return null;

  const clip = (c: Reply, label: string) =>
    urls[c.path] ? (
      <ClipPlayer src={urls[c.path]} durationMs={c.duration_ms} label={label} />
    ) : (
      <p className="muted small">Loading clip...</p>
    );

  const others = (answers ?? []).filter((a) => !a.is_mine).length;

  return (
    <section className="stack" aria-label="Your group's answers">
      <p className="label">Your group&apos;s answers</p>
      {notice && <div className="note" role="status">{notice}</div>}
      {error && <p className="warn" role="alert">{error}</p>}
      {answers && answers.length === 0 && (
        <p className="muted">Nobody has answered yet. Be the first. The others will hear it when they come in.</p>
      )}
      {answers && answers.length > 0 && others === 0 && (
        <p className="muted small">Nobody else has answered yet. You&apos;ll be able to listen and reply when they do.</p>
      )}
      {(answers ?? []).map((a) => (
        <article key={a.id} className="answer stack tight">
          <header className="answer-head">
            <span className="avatar" aria-hidden="true">{initials(a.name)}</span>
            <span className="grow">
              <strong>{a.is_mine ? 'You' : a.name}</strong>
              <span className="muted small"> · {ago(a.created_at)}</span>
            </span>
            {!a.is_mine && (
              <button className="icon-button" aria-label={`Report ${a.name}`} onClick={() => setReporting({ name: a.name, answerId: a.id })}>
                <FlagIcon />
              </button>
            )}
          </header>
          {clip(a, a.is_mine ? 'Your answer' : `${a.name}'s answer`)}

          {a.replies.length > 0 && (
            <ul className="replies">
              {a.replies.map((r) => (
                <li key={r.id} className="stack tight">
                  <div className="answer-head">
                    <span className="avatar small-avatar" aria-hidden="true">{initials(r.name)}</span>
                    <span className="grow small">
                      <strong>{r.is_mine ? 'You' : r.name}</strong>
                      <span className="muted"> · {ago(r.created_at)}</span>
                    </span>
                    {!r.is_mine && (
                      <button className="icon-button" aria-label={`Report ${r.name}`} onClick={() => setReporting({ name: r.name, replyId: r.id })}>
                        <FlagIcon />
                      </button>
                    )}
                  </div>
                  {clip(r, r.is_mine ? 'Your reply' : `${r.name}'s reply`)}
                </li>
              ))}
            </ul>
          )}

          <ReplyRecorder
            to={a.is_mine ? 'your group' : a.name}
            onSend={async (take) => {
              await postReply(group.id, a.id, take);
              await load();
            }}
          />
        </article>
      ))}

      {reporting && (
        <ReportSheet
          name={reporting.name}
          onClose={() => setReporting(null)}
          onSubmit={async (reason) => {
            await reportClip({ answerId: reporting.answerId, replyId: reporting.replyId }, reason);
            setNotice(`Thanks. You won't hear from ${reporting.name} again.`);
            setReporting(null);
            await Promise.all([load(), refresh()]);
          }}
        />
      )}
    </section>
  );
}
