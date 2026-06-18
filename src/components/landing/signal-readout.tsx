"use client";

import { ScanFace, AudioWaveform, MessagesSquare } from "lucide-react";

const BARS = [0.4, 0.7, 0.45, 0.9, 0.6, 1, 0.5, 0.8, 0.35, 0.7, 0.55, 0.95, 0.5, 0.75, 0.4];

function Meter({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-2 text-muted">
          {icon}
          {label}
        </span>
        <span className="readout font-medium text-ink">{value}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/** The product's "instrument panel": what MetaHire reads during one answer. */
export function SignalReadout() {
  return (
    <div className="relative rounded-3xl border border-line bg-surface/90 p-5 shadow-lift backdrop-blur sm:p-6">
      {/* live header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-live" />
          </span>
          <span className="readout text-xs uppercase tracking-wider text-muted">
            Live read · Q3 / 10
          </span>
        </div>
        <span className="readout text-xs text-muted">Backend Developer · Mid</span>
      </div>

      {/* waveform */}
      <div className="mt-5 flex h-24 items-center justify-center gap-[5px] rounded-2xl border border-line bg-bg/60 px-4">
        {BARS.map((h, i) => (
          <span
            key={i}
            className="wave-bar w-[5px] rounded-full bg-brand"
            style={{
              height: `${h * 100}%`,
              animationDelay: `${i * 0.07}s`,
              animationDuration: `${1 + (i % 4) * 0.12}s`,
            }}
          />
        ))}
      </div>

      {/* meters */}
      <div className="mt-6 space-y-4">
        <Meter
          icon={<MessagesSquare className="h-4 w-4" />}
          label="Answer"
          value={82}
          color="rgb(var(--accent))"
        />
        <Meter
          icon={<AudioWaveform className="h-4 w-4" />}
          label="Tone"
          value={74}
          color="rgb(var(--amber))"
        />
        <Meter
          icon={<ScanFace className="h-4 w-4" />}
          label="Expression"
          value={78}
          color="rgb(var(--green))"
        />
      </div>

      {/* aggregate */}
      <div className="mt-6 flex items-end justify-between rounded-2xl bg-brand px-5 py-4 text-white">
        <div>
          <p className="readout text-xs uppercase tracking-wider text-white/70">
            Session score
          </p>
          <p className="readout mt-0.5 text-3xl font-medium">
            78<span className="text-base text-white/60"> / 100</span>
          </p>
        </div>
        <p className="max-w-[8.5rem] text-right text-xs leading-snug text-white/80">
          Strong reasoning, confident delivery.
        </p>
      </div>
    </div>
  );
}
