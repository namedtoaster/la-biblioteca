'use client';

import { useEffect, useState } from 'react';
import { DayView } from '@/components/DayView';
import { FirstHola } from '@/components/FirstHola';
import { dayKey } from '@/lib/days';
import { listClips, readSettings, writeSettings } from '@/lib/store';

export default function TodayPage() {
  const [today, setToday] = useState<string | null>(null);
  const [firstVisit, setFirstVisit] = useState<boolean | null>(null);

  // The day depends on the visitor's clock, so it is only known in the browser.
  useEffect(() => {
    setToday(dayKey());
    listClips().then((clips) => setFirstVisit(clips.length === 0 && !readSettings().skippedHola));
  }, []);

  if (!today || firstVisit === null) return null;
  if (firstVisit) {
    return (
      <FirstHola
        onDone={() => {
          writeSettings({ skippedHola: true });
          setFirstVisit(false);
        }}
      />
    );
  }
  return <DayView day={today} isToday />;
}
