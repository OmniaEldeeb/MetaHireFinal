/**
 * Audio recorder — wraps MediaRecorder, provides start/stop plus optional
 * periodic chunk streaming (used for live tone analysis). Works in Chrome and
 * Firefox (WebM/Ogg).
 *
 * Design notes:
 *  • We use the *timeslice* form `MediaRecorder.start(chunkMs)`. The browser
 *    then emits `dataavailable` slices that are guaranteed to concatenate into
 *    a single valid recording — unlike manually-spaced `requestData()` calls,
 *    which on some setups yield a file the server cannot decode ("could not
 *    transcribe audio").
 *  • `fullChunks` collects *every* slice so `stop()` returns the complete
 *    answer for transcription. Each slice is also forwarded to `onChunk` for
 *    the tone endpoint.
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private fullChunks: Blob[] = [];
  private mime = "audio/webm";

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

  start(onChunk?: (blob: Blob, index: number) => void, chunkMs = 3000) {
    if (!this.stream) throw new Error("No microphone stream");
    this.fullChunks = [];
    let chunkIndex = 1;

    this.mime = this.pickMime();
    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: this.mime });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        // Keep every slice for the full answer …
        this.fullChunks.push(e.data);
        // … and forward this slice to the live tone stream.
        onChunk?.(e.data, chunkIndex++);
      }
    };

    // Timeslice only when we need periodic chunks; otherwise capture one blob.
    if (onChunk) this.mediaRecorder.start(chunkMs);
    else this.mediaRecorder.start();
  }

  /** Stops recording and resolves with the complete answer audio. */
  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        return resolve(new Blob(this.fullChunks, { type: this.mime }));
      }
      this.mediaRecorder.onstop = () => {
        // stop() flushes a final dataavailable before this fires, so fullChunks
        // already contains the tail — the whole answer is captured.
        resolve(new Blob(this.fullChunks, { type: this.mime }));
      };
      this.mediaRecorder.stop();
    });
  }

  releaseMic() {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }
    } catch {
      /* ignore */
    }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.mediaRecorder = null;
    this.fullChunks = [];
  }

  get isRecording() {
    return this.mediaRecorder?.state === "recording";
  }

  get mimeType() {
    return this.mime;
  }
}
