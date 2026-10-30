'use client';

import { CheckIcon } from './Icons';
import { formatDay } from '@/lib/days';
import { groupProgress, initials } from '@/lib/groups';
import { useGroup } from '@/lib/useGroup';

// Pattern sources (Mobbin, seen 2026-10-30):
// - a "Today" list of each member with today's status: Jomo Squads
// - "Members 3/10" capacity: Discord group members
// - "You've completed 0 out of 10 days" with numbered day squares: Insight Timer challenges
export function GroupCard() {
  const { group, today, todayKey } = useGroup();
  if (!group || !todayKey) return null;

  const { day, total } = groupProgress(group, todayKey);
  const answered = new Set(today.map((a) => a.user_id));

  return (
    <section className="group-card stack" aria-label="Your group">
      <div className="stack tight">
        <p className="label">Your group</p>
        <p className="small muted">
          {formatDay(group.starts_on)} to {formatDay(group.ends_on)} · Day {day} of {total}
        </p>
      </div>
      <ol className="days" aria-label={`Day ${day} of ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <li key={i} className={i + 1 < day ? 'past' : i + 1 === day ? 'now' : ''}>{i + 1}</li>
        ))}
      </ol>
      <div className="stack tight">
        <p className="small muted">
          Today · {group.members.length} of {group.capacity} members
        </p>
        <ul className="members">
          {group.members.map((m) => (
            <li key={m.user_id}>
              <span className="avatar" aria-hidden="true">{initials(m.name)}</span>
              <span className="grow">{m.is_me ? `${m.name} (you)` : m.name}</span>
              {answered.has(m.user_id) ? (
                <span className="done small" aria-label="Answered today"><CheckIcon size={16} /> answered</span>
              ) : (
                <span className="muted small">not yet</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
