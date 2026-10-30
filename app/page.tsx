'use client';

import { useEffect, useState } from 'react';
import { DayView } from '@/components/DayView';
import { dayKey } from '@/lib/days';

export default function TodayPage() {
  const [today, setToday] = useState<string | null>(null);

  // The day depends on the visitor's clock, so it is only known in the browser.
  useEffect(() => setToday(dayKey()), []);

  if (!today) return null;
  return <DayView day={today} isToday />;
}
