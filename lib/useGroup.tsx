'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { dayKey } from './days';
import { type Answer, type GroupInfo, groupDay, myGroup } from './groups';
import { accountsEnabled, supabase } from './supabase';

type GroupState = {
  /** undefined while loading, null when not in a group. */
  group: GroupInfo | null | undefined;
  /** Today's answers in the group, for the "Today" list. */
  today: Answer[];
  todayKey: string;
  refresh: () => Promise<void>;
  error: string | null;
};

const GroupContext = createContext<GroupState>({
  group: null,
  today: [],
  todayKey: '',
  refresh: async () => {},
  error: null,
});

export function GroupProvider({ children }: { children: ReactNode }) {
  const [group, setGroup] = useState<GroupInfo | null | undefined>(undefined);
  const [today, setToday] = useState<Answer[]>([]);
  const [todayKey, setTodayKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const key = dayKey();
    setTodayKey(key);
    if (!accountsEnabled()) {
      setGroup(null);
      return;
    }
    const { data } = await supabase()!.auth.getSession();
    if (!data.session) {
      setGroup(null);
      return;
    }
    try {
      const g = await myGroup();
      setGroup(g);
      setToday(g ? await groupDay(key) : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setGroup(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <GroupContext.Provider value={{ group, today, todayKey, refresh, error }}>{children}</GroupContext.Provider>;
}

export const useGroup = () => useContext(GroupContext);
