/**
 * avatar-kit
 * ==========
 * Single entry point for the 3D interviewer avatar.
 *
 *   import { AvatarScene, useSpeechLipSync } from "./avatar-kit";
 *
 * - AvatarScene       Self-contained R3F canvas (avatar + desk + lights).
 * - Avatar / Desk     Lower-level pieces, if you need a custom scene.
 * - useSpeechLipSync  Lip movement driven by the Web Speech API `speaking` flag
 *                     (what the MetaHire interview TTS uses today).
 * - useAudioLipSync   Spectrum-analysis lip-sync for a real <audio> source —
 *                     kept for a future audio-returning TTS provider.
 *
 * Origin: 0Shark/live-interview (MIT). Avatar: Ready Player Me.
 * Desk: saeed khalili (CC-BY-4.0). Animations: Mixamo.
 */

export { Avatar } from "./Avatar";
export { Desk } from "./Desk";
export { AvatarScene } from "./AvatarScene";
export { useAudioLipSync } from "./useAudioLipSync";
export { useSpeechLipSync } from "./useSpeechLipSync";