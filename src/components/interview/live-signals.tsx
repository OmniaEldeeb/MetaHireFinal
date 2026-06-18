"use client";

import { AudioWaveform, ScanFace } from "lucide-react";

const EMOTION_COLOR: Record<string, string> = {
  happy: "text-green",
  neutral: "text-brand",
  sad: "text-muted",
  angry: "text-coral",
  fear: "text-amber",
  surprise: "text-amber",
  disgust: "text-coral",
};

function Meter({
  icon: Icon,
  label,
  value,
  emotion,
}: {
  icon: typeof AudioWaveform;
  label: string;
  value: number | null;
  emotion: string | null;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-faint">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        {emotion && (
          <span className={`capitalize font-medium ${EMOTION_COLOR[emotion] ?? "text-muted"}`}>
            {emotion}
          </span>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500"
          style={{ width: `${value ?? 0}%` }}
        />
      </div>
    </div>
  );
}

export function LiveSignals({
  toneScore,
  toneEmotion,
  faceScore,
  faceEmotion,
  webcamRef,
  webcamGranted,
}: {
  toneScore: number | null;
  toneEmotion: string | null;
  faceScore: number | null;
  faceEmotion: string | null;
  webcamRef: React.RefObject<HTMLVideoElement>;
  webcamGranted: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      {/* Webcam — the <video> is always mounted so its ref is available to the
          orchestrator; the placeholder is overlaid until the camera is granted. */}
      <div className="relative mb-4 overflow-hidden rounded-xl bg-bg-3" style={{ aspectRatio: "4/3" }}>
        <video
          ref={webcamRef}
          autoPlay
          muted
          playsInline
          className={`h-full w-full object-cover scale-x-[-1] ${webcamGranted ? "" : "invisible"}`}
        />
        {!webcamGranted && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <ScanFace className="mx-auto h-8 w-8 text-faint" />
              <p className="mt-2 text-xs text-faint">Camera unavailable</p>
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 p-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="wave-bar w-1 rounded-full bg-brand/60"
              style={{
                height: `${(Math.sin(i * 0.7) + 1.2) * 8}px`,
                animationDelay: `${i * 0.08}s`,
                animationDuration: `${1 + (i % 3) * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Meters */}
      <div className="space-y-3">
        <Meter icon={AudioWaveform} label="Voice tone" value={toneScore} emotion={toneEmotion} />
        <Meter icon={ScanFace} label="Expression" value={faceScore} emotion={faceEmotion} />
      </div>
    </div>
  );
}
