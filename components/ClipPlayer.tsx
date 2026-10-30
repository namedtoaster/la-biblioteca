'use client';

import { useEffect, useRef, useState } from 'react';

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

type Props = {
  /** A clip on this device, or... */
  audio?: Blob;
  /** ...a link to a clip stored online. */
  src?: string;
  /** Length measured while recording. Browser recordings often carry no duration of their own. */
  durationMs: number;
  label: string;
};

export function ClipPlayer({ audio, src, durationMs, label }: Props) {
  const el = useRef<HTMLAudioElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [length, setLength] = useState(durationMs / 1000);

  useEffect(() => {
    if (!audio) {
      setUrl(src ?? null);
      return;
    }
    const objectUrl = URL.createObjectURL(audio);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [audio, src]);

  useEffect(() => {
    const a = el.current;
    if (!a || !url) return;
    let fixing = false;
    let giveUp: ReturnType<typeof setTimeout> | undefined;

    const stopFixing = (rewind: boolean) => {
      if (!fixing) return;
      fixing = false;
      clearTimeout(giveUp);
      if (rewind) a.currentTime = 0;
    };

    const onMetadata = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) {
        setLength(a.duration);
        return;
      }
      // Recordings from MediaRecorder report an infinite duration until read to the end.
      // While paused, seeking far past the end makes the browser work it out so seeking works.
      // Some browsers (iPhone Safari) only load a clip once play is pressed: then skip this,
      // and the length measured while recording is used instead.
      if (!a.paused) return;
      fixing = true;
      a.currentTime = 1e7;
      giveUp = setTimeout(() => stopFixing(true), 1000);
    };
    const onDurationChange = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) {
        setLength(a.duration);
        stopFixing(true);
      }
    };
    const onTime = () => {
      if (!fixing) setPosition(a.currentTime);
    };
    const onPlay = () => {
      // Never let the length check interfere with playback.
      stopFixing(true);
      setPlaying(true);
    };
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setPosition(0);
      a.currentTime = 0;
    };

    a.addEventListener('loadedmetadata', onMetadata);
    a.addEventListener('durationchange', onDurationChange);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    return () => {
      clearTimeout(giveUp);
      a.removeEventListener('loadedmetadata', onMetadata);
      a.removeEventListener('durationchange', onDurationChange);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
    };
  }, [url]);

  const toggle = () => {
    const a = el.current;
    if (!a) return;
    if (a.paused) a.play();
    else a.pause();
  };

  const seek = (value: number) => {
    const a = el.current;
    if (!a) return;
    a.currentTime = value;
    setPosition(value);
  };

  const shown = Math.min(position, length);

  return (
    <div className="player" role="group" aria-label={label}>
      <audio ref={el} src={url ?? undefined} preload="metadata" />
      <button className="play" onClick={toggle} aria-label={playing ? `Pause ${label}` : `Play ${label}`} disabled={!url}>
        {playing ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
        )}
      </button>
      <input
        type="range"
        className="scrub"
        min={0}
        max={length || 0}
        step={0.01}
        value={shown}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label={`Position in ${label}`}
        aria-valuetext={`${formatDuration(shown * 1000)} of ${formatDuration(length * 1000)}`}
        style={{ '--fill': `${length ? (shown / length) * 100 : 0}%` } as React.CSSProperties}
      />
      <span className="time">{formatDuration(shown * 1000)} / {formatDuration(length * 1000)}</span>
    </div>
  );
}
