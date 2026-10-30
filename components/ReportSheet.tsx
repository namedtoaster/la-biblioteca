'use client';

import { useState } from 'react';
import type { ReportReason } from '@/lib/groups';

// Pattern sources (Mobbin, seen 2026-10-30):
// - "Why are you reporting this account?" with one-line reason cards and "Your report won't be
//   shared with the other person.": Cash App
// - "We won't tell them you reported them": Tinder, Feeld
// - "Someone under 18 is involved" as a reason: Tinder
const REASONS: { id: ReportReason; title: string; detail: string }[] = [
  { id: 'inappropriate', title: 'Inappropriate', detail: 'Sexual comments, nudity talk, or anything that made you uncomfortable.' },
  { id: 'harassment', title: 'Harassment or bullying', detail: 'Insults, mocking, threats, or hate.' },
  { id: 'spam', title: 'Spam or scam', detail: 'Selling something, links, or asking to move to another app.' },
  { id: 'under18', title: 'They seem under 18', detail: 'This app is for adults only.' },
];

type Props = { name: string; onSubmit: (reason: ReportReason) => Promise<void>; onClose: () => void };

export function ReportSheet({ name, onSubmit, onClose }: Props) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet stack" role="dialog" aria-modal="true" aria-labelledby="report-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="report-title" className="title">Why are you reporting {name}?</h2>
        <p className="muted">We won&apos;t tell {name} you reported them. You won&apos;t hear from them again.</p>
        <div className="stack tight" role="radiogroup" aria-label="Reason">
          {REASONS.map((r) => (
            <button key={r.id} role="radio" aria-checked={reason === r.id} className="choice column" onClick={() => setReason(r.id)}>
              <strong>{r.title}</strong>
              <span className="small muted">{r.detail}</span>
            </button>
          ))}
        </div>
        {error && <p className="warn" role="alert">{error}</p>}
        <button
          className="button primary big"
          disabled={!reason || busy}
          onClick={async () => {
            if (!reason) return;
            setBusy(true);
            try {
              await onSubmit(reason);
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
              setBusy(false);
            }
          }}
        >
          {busy ? 'Reporting...' : 'Report'}
        </button>
        <button className="button ghost" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
