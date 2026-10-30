'use client';

import { useEffect, useState } from 'react';

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function ClipPlayer({ audio, label }: { audio: Blob; label: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(audio);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [audio]);

  if (!url) return null;
  return <audio className="player" controls preload="metadata" src={url} aria-label={label} />;
}
