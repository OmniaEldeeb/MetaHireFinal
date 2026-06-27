"use client";

/**
 * InterviewAvatar
 * ===============
 * Drop-in 3D AI-interviewer for the interview room.
 *
 *   <InterviewAvatar speaking={speaking} label="Reading question…" />
 *
 * - `speaking` comes straight from the interview room's TTS lifecycle. While
 *   true the avatar's lips move (via `useSpeechLipSync`) and it plays a talking
 *   body animation; while false it idles.
 * - The heavy three.js scene is loaded **client-only** with `next/dynamic`
 *   (`ssr: false`) so nothing WebGL touches the server render.
 * - A small error boundary means a browser without WebGL (or a failed asset
 *   load) falls back to a clean placeholder instead of breaking the interview.
 */

import dynamic from "next/dynamic";
import { Component, type ComponentType, type ReactNode } from "react";
import { Loader2, Bot, Volume2 } from "lucide-react";
import { useSpeechLipSync } from "./avatar-kit/useSpeechLipSync";
import type { AvatarSceneProps } from "./avatar-kit";

// Client-only import of the WebGL scene — keeps three.js out of SSR entirely.
const AvatarScene = dynamic(
  () =>
    import("./avatar-kit/AvatarScene").then(
      (m) => ({ default: m.AvatarScene as ComponentType<AvatarSceneProps> })
    ),
  {
    ssr: false,
    loading: () => <SceneLoading />,
  }
);


function SceneLoading() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-faint">
      <Loader2 className="h-6 w-6 animate-spin text-brand" />
      <p className="text-xs">Loading AI interviewer…</p>
    </div>
  );
}

/** Shown if WebGL is unavailable or a 3D asset fails to load. */
function AvatarFallback({ speaking }: { speaking: boolean }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted">
      <div
        className={`grid h-20 w-20 place-items-center rounded-full bg-brand-soft transition-shadow ${
          speaking ? "shadow-[0_0_0_6px_rgba(108,99,255,0.18)]" : ""
        }`}
      >
        <Bot className="h-9 w-9 text-brand" />
      </div>
      <p className="text-xs">AI Interviewer</p>
      {speaking && (
        <span className="flex items-center gap-1 text-xs text-brand">
          <Volume2 className="h-3.5 w-3.5 animate-pulse" /> Speaking…
        </span>
      )}
    </div>
  );
}

class SceneBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    // Non-fatal — the interview continues with the 2D fallback.
    // eslint-disable-next-line no-console
    console.warn("[InterviewAvatar] 3D scene failed, using fallback:", err);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function InterviewAvatar({
  speaking,
  className = "",
}: {
  speaking: boolean;
  className?: string;
}) {
  const { visemes, isPlaying } = useSpeechLipSync(speaking);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <SceneBoundary fallback={<AvatarFallback speaking={speaking} />}>
        <AvatarScene visemes={visemes} isPlaying={isPlaying} />
      </SceneBoundary>
    </div>
  );
}

export default InterviewAvatar;