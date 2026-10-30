'use client';

import { useEffect, useState } from 'react';
import { DayView } from '@/components/DayView';
import { CheckIcon } from '@/components/Icons';
import { dayKey, formatDay, shiftDay } from '@/lib/days';
import { questionFor } from '@/lib/questions';
import { listClips } from '@/lib/store';

const DAYS_BACK = 14;

export default function QuestionsPage() {
  const [today, setToday] = useState<string | null>(null);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    setToday(dayKey());
    listClips().then((all) => setAnswered(new Set(all.filter((c) => c.kind === 'answer').map((c) => c.day))));
  }, [open]);

  if (!today) return null;

  if (open) {
    return (
      <div className="stack">
        <button className="link back" onClick={() => setOpen(null)}>← All questions</button>
        <DayView day={open} isToday={open === today} />
      </div>
    );
  }

  const days = Array.from({ length: DAYS_BACK }, (_, i) => shiftDay(today, -i));

  return (
    <div className="stack">
      <h1 className="title">Questions</h1>
      <p className="muted">Every question stays open. Answer any of them, any time.</p>
      <ul className="list">
        {days.map((day) => (
          <li key={day}>
            <button className="list-item" onClick={() => setOpen(day)}>
              <span className="stack tight">
                <span className="small muted">{day === today ? 'Today' : formatDay(day)}</span>
                <span lang="es">{questionFor(day).text}</span>
              </span>
              {answered.has(day) && (
                <span className="done" aria-label="Answered"><CheckIcon /></span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
