'use client';

import type { Take } from './useRecorder';
import { supabase } from './supabase';

// Practice groups: a few people answer the same daily question and reply to each other by voice.
// Everything goes through the database functions in supabase/migrations/0001_groups.sql.

export type Member = { user_id: string; name: string; is_me: boolean };

export type GroupInfo = {
  id: string;
  starts_on: string;
  ends_on: string;
  capacity: number;
  members: Member[];
};

export type Reply = {
  id: string;
  user_id: string;
  name: string;
  is_mine: boolean;
  path: string;
  duration_ms: number;
  created_at: string;
};

export type Answer = Reply & { replies: Reply[] };

export type ReportReason = 'inappropriate' | 'harassment' | 'spam' | 'under18';

function client() {
  const sb = supabase();
  if (!sb) throw new Error('Accounts are not set up on this copy of the app.');
  return sb;
}

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await client().rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const myGroup = () => rpc<GroupInfo | null>('my_group');
export const joinGroup = (name: string, level: number) => rpc<string>('join_group', { p_name: name, p_level: level });
export const leaveGroup = () => rpc<void>('leave_group');
export const groupDay = (day: string) => rpc<Answer[]>('group_day', { p_day: day });

async function upload(groupId: string, take: Take): Promise<string> {
  const sb = client();
  const { data } = await sb.auth.getSession();
  const me = data.session?.user.id;
  if (!me) throw new Error('Please sign in again.');
  const type = take.blob.type.split(';')[0] || 'audio/webm';
  const ext = type === 'audio/mp4' ? 'm4a' : type.split('/')[1];
  const path = `${groupId}/${me}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from('clips').upload(path, take.blob, { contentType: type });
  if (error) throw new Error(error.message);
  return path;
}

export async function postAnswer(groupId: string, day: string, questionId: string, take: Take): Promise<void> {
  const path = await upload(groupId, take);
  await rpc('post_answer', { p_day: day, p_question: questionId, p_path: path, p_duration: Math.round(take.durationMs) });
}

export async function postReply(groupId: string, answerId: string, take: Take): Promise<void> {
  const path = await upload(groupId, take);
  await rpc('post_reply', { p_answer: answerId, p_path: path, p_duration: Math.round(take.durationMs) });
}

export const reportClip = (target: { answerId?: string; replyId?: string }, reason: ReportReason) =>
  rpc<void>('report_clip', { p_answer: target.answerId ?? null, p_reply: target.replyId ?? null, p_reason: reason });

/** Short lived links to play group clips. Clips are private; only group members get links. */
export async function clipUrls(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const { data, error } = await client().storage.from('clips').createSignedUrls(paths, 60 * 60);
  if (error) throw new Error(error.message);
  const urls: Record<string, string> = {};
  for (const item of data ?? []) if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
  return urls;
}

/** Day number within the group (1 based) and the total, from the group's dates. */
export function groupProgress(group: GroupInfo, today: string): { day: number; total: number } {
  const ms = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
  const total = Math.round((ms(group.ends_on) - ms(group.starts_on)) / 86_400_000) + 1;
  const day = Math.min(total, Math.max(1, Math.round((ms(today) - ms(group.starts_on)) / 86_400_000) + 1));
  return { day, total };
}

export function initials(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
