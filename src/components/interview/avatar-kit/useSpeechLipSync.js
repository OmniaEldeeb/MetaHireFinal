"use client";

/**
 * useSpeechLipSync
 * ================
 * The MetaHire interview reads questions aloud through the browser
 * Web Speech API (`window.speechSynthesis`). That API plays audio directly
 * through the OS and does **not** expose an <audio> element or media stream,
 * so the spectrum-analysis approach in `useAudioLipSync` has nothing to read.
 *
 * This hook instead synthesizes believable mouth movement from a single
 * `speaking` boolean. While `speaking` is true it runs a requestAnimationFrame
 * loop that produces a smoothly-varying "amplitude" (layered sine waves +
 * light jitter) and distributes it across the four Ready-Player-Me visemes,
 * rotating the dominant shape so the lips look like they're forming phonemes.
 * When `speaking` flips to false the mouth eases shut.
 *
 * The output shape is identical to `useAudioLipSync`, so it's a drop-in source
 * for <Avatar> / <AvatarScene>:
 *
 *   const { visemes, isPlaying } = useSpeechLipSync(speaking);
 *   <AvatarScene visemes={visemes} isPlaying={isPlaying} />
 *
 * If/when the interview switches to a real audio TTS (ElevenLabs, cloud TTS,
 * etc. that returns a URL/Blob), swap this for `useAudioLipSync` and feed it
 * the audio source — the <Avatar> contract doesn't change.
 *
 * @param {boolean} speaking - true while the interviewer question is being read
 * @returns {{ visemes: object, isPlaying: boolean }}
 */

import { useEffect, useRef, useState } from "react";

const VISEME_KEYS = ["viseme_O", "viseme_aa", "viseme_E", "viseme_I"];

const ZERO = Object.freeze({
  viseme_O: 0,
  viseme_aa: 0,
  viseme_E: 0,
  viseme_I: 0,
  jawOpen: 0,
});

export function useSpeechLipSync(speaking) {
  const [visemes, setVisemes] = useState(ZERO);

  const rafRef = useRef(null);
  const startRef = useRef(0);
  const envRef = useRef(0); // smoothed open/close envelope
  const domRef = useRef(0); // index of dominant viseme
  const nextSwapRef = useRef(0); // time of next dominant-viseme swap
  const idleRef = useRef(true); // are we already fully closed?

  useEffect(() => {
    const tick = (now) => {
      if (!startRef.current) startRef.current = now;
      const t = (now - startRef.current) / 1000; // seconds

      // Envelope eases toward 1 while speaking, 0 otherwise.
      const target = speaking ? 1 : 0;
      envRef.current += (target - envRef.current) * 0.18;

      // Fully closed and not speaking -> emit ZERO once, then idle cheaply.
      if (!speaking && envRef.current < 0.01) {
        if (!idleRef.current) {
          idleRef.current = true;
          setVisemes(ZERO);
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      idleRef.current = false;

      // Rotate the dominant viseme every ~140-220ms while speaking so the lips
      // form different shapes instead of holding one vowel.
      if (speaking && now >= nextSwapRef.current) {
        domRef.current = Math.floor(Math.random() * VISEME_KEYS.length);
        nextSwapRef.current = now + 140 + Math.random() * 80;
      }

      // Speech-like amplitude from layered oscillators + a little jitter.
      const osc =
        0.55 + 0.3 * Math.sin(t * 11.0) + 0.15 * Math.sin(t * 23.0 + 1.3);
      const jitter = 0.9 + Math.random() * 0.2;
      const amp = Math.max(0, Math.min(1, osc * jitter)) * envRef.current;

      const next = {
        viseme_O: 0,
        viseme_aa: 0,
        viseme_E: 0,
        viseme_I: 0,
        jawOpen: Math.min(1, amp * 1.1),
      };
      VISEME_KEYS.forEach((key, i) => {
        next[key] = i === domRef.current ? amp : amp * 0.25;
      });

      setVisemes(next);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speaking]);

  return { visemes, isPlaying: !!speaking };
}