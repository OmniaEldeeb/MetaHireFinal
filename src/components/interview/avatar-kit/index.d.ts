/**
 * Type declarations for the avatar-kit barrel.
 *
 * The kit itself is authored in plain JSX/JS (it leans on @react-three/fiber's
 * intrinsic JSX elements, which are awkward to type in app code). These
 * lightweight declarations let the typed `.tsx` wrapper import the kit without
 * dragging three.js JSX typings into the project's build-time type check.
 */

import type { ComponentType, RefObject } from "react";

export interface Visemes {
  viseme_O: number;
  viseme_aa: number;
  viseme_E: number;
  viseme_I: number;
  jawOpen: number;
  [key: string]: number;
}

export interface AvatarSceneProps {
  visemes?: Partial<Visemes>;
  isPlaying?: boolean;
  background?: string;
  bgImage?: string | null;
}

export const AvatarScene: ComponentType<AvatarSceneProps>;

export interface AvatarProps {
  visemes?: Partial<Visemes>;
  isPlaying?: boolean;
  modelUrl?: string;
  headFollow?: boolean;
  smoothing?: number;
  [key: string]: unknown;
}

export const Avatar: ComponentType<AvatarProps>;
export const Desk: ComponentType<Record<string, unknown>>;

/** Lip movement synthesized from a Web Speech API `speaking` flag. */
export function useSpeechLipSync(speaking: boolean): {
  visemes: Visemes;
  isPlaying: boolean;
};

/** Spectrum-analysis lip-sync for a real audio source (URL | base64 | Blob). */
export function useAudioLipSync(): {
  playAudio: (source: string | Blob | File | HTMLAudioElement) => Promise<void>;
  stopAudio: () => void;
  isPlaying: boolean;
  currentVisemes: Visemes;
  error: string | null;
  audioElement: HTMLAudioElement | null;
};