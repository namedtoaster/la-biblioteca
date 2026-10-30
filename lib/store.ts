'use client';

import { createStore, del, get, set, values } from 'idb-keyval';

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
};

const clips = typeof indexedDB === 'undefined' ? undefined : createStore('la-biblioteca', 'clips');

export async function saveClip(clip: Omit<Clip, 'id' | 'createdAt'>): Promise<Clip> {
  const full: Clip = { ...clip, id: crypto.randomUUID(), createdAt: Date.now() };
  await set(full.id, full, clips);
  return full;
}

export async function listClips(): Promise<Clip[]> {
  if (!clips) return [];
  const all = await values<Clip>(clips);
  return all.sort((a, b) => a.createdAt - b.createdAt);
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
