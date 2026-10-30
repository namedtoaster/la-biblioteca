'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderState = 'idle' | 'recording' | 'done' | 'denied' | 'unsupported';

export type Take = { blob: Blob; durationMs: number };

export const MAX_SECONDS = 90;

function pickMimeType(): string | undefined {
  const options = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'];
  return options.find((type) => MediaRecorder.isTypeSupported(type));
}

export function useRecorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [take, setTake] = useState<Take | null>(null);
  const [takes, setTakes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);

  const releaseMic = () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  };

  const start = useCallback(async () => {
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setState('unsupported');
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState('denied');
      return;
    }
    const mimeType = pickMimeType();
    const rec = new MediaRecorder(stream.current, mimeType ? { mimeType } : undefined);
    chunks.current = [];
    rec.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.current.push(event.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' });
      setTake({ blob, durationMs: Date.now() - startedAt.current });
      setTakes((n) => n + 1);
      setState('done');
      releaseMic();
    };
    recorder.current = rec;
    startedAt.current = Date.now();
    setSeconds(0);
    rec.start();
    setState('recording');
  }, []);

  const stop = useCallback(() => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }, []);

  const reset = useCallback(() => {
    setTake(null);
    setState('idle');
  }, []);

  useEffect(() => {
    if (state !== 'recording') return;
    const timer = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt.current) / 1000);
      setSeconds(s);
      if (s >= MAX_SECONDS) recorder.current?.stop();
    }, 250);
    return () => clearInterval(timer);
  }, [state]);

  useEffect(() => () => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
    releaseMic();
  }, []);

  return { state, take, takes, seconds, start, stop, reset };
}
