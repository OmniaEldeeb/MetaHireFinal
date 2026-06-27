"use client";

/**
 * useAudioLipSync
 * ===============
 * Hook بياخد أي مصدر صوت (URL / base64 / Blob) ويرجّع visemes لحظية
 * محسوبة من تحليل الـ frequency spectrum للصوت عبر Web Audio API.
 *
 * مش بيحتاج Azure، مش بيحتاج LLM يبعت visemes — كل حاجة في المتصفح.
 *
 * الفكرة: نقسّم الطيف الترددي لـ ٤ نطاقات، وكل نطاق بيمثّل شكل شفايف:
 *   - low (100-500 Hz)   → "O"  (شفايف مدوّرة)
 *   - mid (500-1500 Hz)  → "A"  (بق مفتوح)
 *   - high (1500-3000 Hz)→ "E"  (شفايف واسعة)
 *   - vhigh (3k-6k Hz)   → "I"  (شفايف واسعة جداً)
 *
 * الـ amplitude العام بيحدّد درجة فتح البق.
 */

import { useRef, useState, useEffect, useCallback } from "react";

const NUM_BANDS = 4;
const FFT_SIZE = 1024;

// أسماء visemes بتاعة Ready Player Me (Oculus visemes)
const BAND_TO_VISEME = ["viseme_O", "viseme_aa", "viseme_E", "viseme_I"];

export function useAudioLipSync() {
  const audioRef = useRef(null);
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const rafRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVisemes, setCurrentVisemes] = useState({
    viseme_O: 0,
    viseme_aa: 0,
    viseme_E: 0,
    viseme_I: 0,
    jawOpen: 0,
  });
  const [error, setError] = useState(null);

  // هل الصوت شغّال فعلاً؟ بنcheck كل frame
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onError = (e) => setError("فشل تشغيل الصوت: " + (audio.error?.code || "unknown"));

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  // loop تحليل الـ frequencies وتحديث الـ visemes
  const analyze = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) {
      rafRef.current = requestAnimationFrame(analyze);
      return;
    }

    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    // sample rate ~ 44100، يبقى كل bin = 44100 / FFT_SIZE ≈ 43 Hz
    const binWidth = (ctxRef.current?.sampleRate || 44100) / FFT_SIZE;
    const bandEdges = [
      [100, 500],    // low → O
      [500, 1500],   // mid → A
      [1500, 3000],  // high → E
      [3000, 6000],  // vhigh → I
    ];

    const bands = bandEdges.map(([lo, hi]) => {
      const start = Math.floor(lo / binWidth);
      const end = Math.min(Math.ceil(hi / binWidth), data.length);
      let sum = 0, count = 0;
      for (let i = start; i < end; i++) { sum += data[i]; count++; }
      return count > 0 ? sum / count / 255 : 0; // normalize 0-1
    });

    // amplitude العام = متوسط كل الـ bands
    const overall = bands.reduce((a, b) => a + b, 0) / bands.length;

    // أبرز viseme = أكبر band
    const maxBand = bands.indexOf(Math.max(...bands));

    // نع multiplier الـ amplitude لإبراز الحركة
    const gain = 1.8;
    const visemes = {
      viseme_O: maxBand === 0 ? bands[0] * gain : bands[0] * 0.3,
      viseme_aa: maxBand === 1 ? bands[1] * gain : bands[1] * 0.3,
      viseme_E: maxBand === 2 ? bands[2] * gain : bands[2] * 0.3,
      viseme_I: maxBand === 3 ? bands[3] * gain : bands[3] * 0.3,
      jawOpen: Math.min(1, overall * 2.2), // فتح البق = الـ amplitude العام
    };

    setCurrentVisemes(visemes);
    rafRef.current = requestAnimationFrame(analyze);
  }, []);

  // start الـ analyzer loop
  useEffect(() => {
    rafRef.current = requestAnimationFrame(analyze);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyze]);

  /**
   * playAudio(source)
   *   source: string URL | base64 string | Blob | File | HTMLAudioElement
   * بينشئ AudioContext و AnalyserNode ويشغّل الصوت.
   */
  const playAudio = useCallback(async (source) => {
    try {
      setError(null);

      // 1) جهّز الـ AudioContext (لازم بعد user gesture)
      if (!ctxRef.current) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        ctxRef.current = new Ctx();
      }
      if (ctxRef.current.state === "suspended") {
        await ctxRef.current.resume();
      }

      // 2) جهّز الـ Audio element
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.crossOrigin = "anonymous";
      }
      const audio = audioRef.current;

      // 3) اضبط المصدر
      if (source instanceof Blob || source instanceof File) {
        const url = URL.createObjectURL(source);
        audio.src = url;
      } else if (typeof source === "string") {
        audio.src = source; // URL أو base64 data URI
      } else if (source instanceof HTMLAudioElement) {
        // استخدم العنصر الموجود
        if (audioRef.current !== source) {
          audioRef.current.pause();
          audioRef.current = source;
        }
      } else {
        throw new Error("مصدر صوت غير مدعوم");
      }

      // 4) اربط الـ source بالـ analyser (مرة واحدة بس)
      if (!sourceRef.current || sourceRef.current.mediaElement !== audioRef.current) {
        try {
          sourceRef.current?.disconnect();
        } catch {}
        sourceRef.current = ctxRef.current.createMediaElementSource(audioRef.current);
        analyserRef.current = ctxRef.current.createAnalyser();
        analyserRef.current.fftSize = FFT_SIZE;
        analyserRef.current.smoothingTimeConstant = 0.6;
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(ctxRef.current.destination);
      }

      // 5) شغّل
      await audioRef.current.play();
    } catch (err) {
      console.error("[useAudioLipSync] error:", err);
      setError(err.message);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return {
    playAudio,
    stopAudio,
    isPlaying,
    currentVisemes,
    error,
    audioElement: audioRef.current,
  };
}