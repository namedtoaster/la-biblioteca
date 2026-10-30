'use client';

import { createStore, del, get, set, values } from 'idb-keyval';
import { supabase } from './supabase';

// Version 0.1 keeps everything in this browser. Nothing is uploaded.

export type ClipKind = 'first' | 'answer';

export type Clip = {
  id: string;
  kind: ClipKind;
  createdAt: number;
  day: string;
  questionId: string | null;
  durationMs: number;
  audio: Blob;
  /** Account that recorded it. Missing means recorded while signed out. */
  owner?: string | null;
};

const clips = typeof indexedDB === 'undefined' ? undefined : createStore('la-biblioteca', 'clips');

/** The signed in account, read from local storage (no network call). */
async function currentOwner(): Promise<string | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function saveClip(clip: Omit<Clip, 'id' | 'createdAt' | 'owner'>): Promise<Clip> {
  const full: Clip = { ...clip, id: crypto.randomUUID(), createdAt: Date.now(), owner: await currentOwner() };
  await set(full.id, full, clips);
  return full;
}

/**
 * Clips for whoever is using the app now. Signed in, that is your clips, and any recorded
 * before you signed in become yours. Signed out, only clips nobody has claimed.
 * This hides other people's clips on a shared device; it does not encrypt them.
 */
export async function listClips(): Promise<Clip[]> {
  if (!clips) return [];
  const owner = await currentOwner();
  const all = await values<Clip>(clips);
  if (owner) {
    const unclaimed = all.filter((c) => !c.owner);
    await Promise.all(unclaimed.map((c) => set(c.id, { ...c, owner }, clips)));
    unclaimed.forEach((c) => (c.owner = owner));
  }
  return all.filter((c) => (c.owner ?? null) === owner).sort((a, b) => a.createdAt - b.createdAt);
}

export async function getClip(id: string): Promise<Clip | undefined> {
  return get<Clip>(id, clips);
}

export async function deleteClip(id: string): Promise<void> {
  await del(id, clips);
}

export type Settings = {
  onboarded: boolean;
  level: 1 | 2 | 3;
  adult: boolean;
  /** The first-clip prompt on Hoy was done or skipped. */
  skippedHola?: boolean;
};

const SETTINGS_KEY = 'la-biblioteca:settings';
const DEFAULTS: Settings = { onboarded: false, level: 1, adult: false };

export function readSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function writeSettings(patch: Partial<Settings>): Settings {
  const next = { ...readSettings(), ...patch };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Private windows can refuse storage. The app still works for this visit.
  }
  return next;
}
