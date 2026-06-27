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
}: {
  toneScore: number | null;
  toneEmotion: string | null;
  faceScore: number | null;
  faceEmotion: string | null;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      {/* Meters — the candidate camera is shown as a self-view tile on the
          interviewer stage, so this panel focuses on the live signal scores. */}
      <div className="space-y-3">
        <Meter icon={AudioWaveform} label="Voice tone" value={toneScore} emotion={toneEmotion} />
        <Meter icon={ScanFace} label="Expression" value={faceScore} emotion={faceEmotion} />
      </div>
    </div>
  );
}