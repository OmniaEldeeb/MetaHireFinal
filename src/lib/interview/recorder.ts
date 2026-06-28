/**
 * Audio recorder — wraps MediaRecorder for the interview.
 *
 * It serves two consumers that need DIFFERENT shapes of audio, so it runs
 * TWO MediaRecorders on the same mic stream:
 *
 *  1. Answer recorder (continuous, no timeslice)
 *     Records the whole answer as ONE complete WebM (with a header) and
 *     returns it from stop(). This is what gets transcribed by Whisper.
 *
 *  2. Chunk recorder (short start/stop cycle, every `chunkMs`)
 *     Produces a fresh, *standalone* WebM clip every few seconds — each clip
 *     has its own header, so the tone service can decode every one of them.
 *
 * Why two recorders? A single MediaRecorder in *timeslice* mode only puts the
 * WebM header in the FIRST slice; every later slice is a headerless fragment
 * that ffmpeg/PyAV rejects ("Invalid data found when processing input"). That
 * made all tone chunks after the first fail to decode (tone score = 0).
 * Recording each chunk as its own complete clip fixes that, while the separate
 * continuous recorder keeps the full answer valid for transcription.
 */
export class AudioRecorder {
  private stream: MediaStream | null = null;
  private mime = "audio/webm";

  // 1) Continuous recorder → the full answer (sent to Whisper).
  private answerRecorder: MediaRecorder | null = null;
  private answerChunks: Blob[] = [];

  // 2) Cycling recorder → standalone clips for live tone analysis.
  private chunkRecorder: MediaRecorder | null = null;
  private chunkTimer: ReturnType<typeof setTimeout> | null = null;
  private onChunk?: (blob: Blob, index: number) => void;
  private chunkMs = 3000;
  private chunkActive = false;

  // Monotonic across the WHOLE interview. The tone endpoint enforces a unique
  // (interview_id, chunk_index); resetting per question would resend index 1,
  // 2, 3… and collide. Only releaseMic() (end of interview) clears it.
  private chunkIndex = 1;

  async requestMic(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  }

  private pickMime(): string {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];
    for (const c of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
        return c;
      }
    }
    return "audio/webm";
  }

  /**
   * Begin recording. If `onChunk` is supplied, standalone audio clips are
   * streamed to it every `chunkMs` (for live tone analysis) while the full
   * answer is captured in parallel.
   */
  start(onChunk?: (blob: Blob, index: number) => void, chunkMs = 3000) {
    if (!this.stream) throw new Error("No microphone stream");

    this.mime = this.pickMime();
    this.onChunk = onChunk;
    this.chunkMs = chunkMs;

    // 1) Continuous answer recorder — one clean, header-complete WebM.
    //    32 kbps Opus mono is plenty for speech and keeps the upload small
    //    (~300-400 KB/answer instead of ~2.4 MB), which is much kinder to the
    //    tunnel. Format is unchanged, so Whisper/tone/validation are unaffected.
    this.answerChunks = [];
    this.answerRecorder = new MediaRecorder(this.stream, {
      mimeType: this.mime,
      audioBitsPerSecond: 32000,
    });
    this.answerRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.answerChunks.push(e.data);
    };
    this.answerRecorder.start(); // no timeslice → single continuous recording

    // 2) Chunk recorder cycle — each clip is a complete, decodable WebM.
    if (onChunk) {
      this.chunkActive = true;
      this.startChunkCycle();
    }
  }

  /** Record one self-contained ~chunkMs clip, emit it, then start the next. */
  private startChunkCycle() {
    if (!this.chunkActive || !this.stream) return;

    const rec = new MediaRecorder(this.stream, {
      mimeType: this.mime,
      audioBitsPerSecond: 32000,
    });
    const parts: Blob[] = [];

    rec.ondataavailable = (e) => {
      if (e.data.size > 0) parts.push(e.data);
    };
    rec.onstop = () => {
      if (parts.length) {
        // Complete WebM (its own header) → tone service decodes it cleanly.
        const clip = new Blob(parts, { type: this.mime });
        this.onChunk?.(clip, this.chunkIndex++);
      }
      // Immediately roll into the next clip while still recording.
      if (this.chunkActive) this.startChunkCycle();
    };

    this.chunkRecorder = rec;
    rec.start();

    this.chunkTimer = setTimeout(() => {
      if (rec.state !== "inactive") rec.stop();
    }, this.chunkMs);
  }

  /** Stops recording and resolves with the complete answer audio. */
  stop(): Promise<Blob> {
    // End the chunk cycle (the final clip is flushed by its own onstop).
    this.chunkActive = false;
    if (this.chunkTimer) {
      clearTimeout(this.chunkTimer);
      this.chunkTimer = null;
    }
    try {
      if (this.chunkRecorder && this.chunkRecorder.state !== "inactive") {
        this.chunkRecorder.stop();
      }
    } catch {
      /* ignore */
    }
    this.chunkRecorder = null;

    // Resolve with the full continuous answer recording.
    return new Promise((resolve) => {
      const finish = () =>
        resolve(new Blob(this.answerChunks, { type: this.mime }));

      if (!this.answerRecorder || this.answerRecorder.state === "inactive") {
        return finish();
      }
      this.answerRecorder.onstop = finish;
      this.answerRecorder.stop(); // flushes a final dataavailable, then onstop
    });
  }

  releaseMic() {
    this.chunkActive = false;
    if (this.chunkTimer) {
      clearTimeout(this.chunkTimer);
      this.chunkTimer = null;
    }
    try {
      if (this.chunkRecorder && this.chunkRecorder.state !== "inactive") {
        this.chunkRecorder.stop();
      }
    } catch {
      /* ignore */
    }
    try {
      if (this.answerRecorder && this.answerRecorder.state !== "inactive") {
        this.answerRecorder.stop();
      }
    } catch {
      /* ignore */
    }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.answerRecorder = null;
    this.chunkRecorder = null;
    this.answerChunks = [];
    this.chunkIndex = 1; // fresh interview → start indices over
  }

  get isRecording() {
    return this.answerRecorder?.state === "recording";
  }

  get mimeType() {
    return this.mime;
  }
}