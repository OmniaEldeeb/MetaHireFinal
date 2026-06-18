/**
 * Webcam capture — streams video + grabs JPEG frames via canvas.
 * Falls back gracefully when no camera is available.
 */
export class WebcamCapture {
  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private captureInterval: ReturnType<typeof setInterval> | null = null;

  /** Returns true if permission was granted, false if denied/unavailable. */
  async start(
    videoEl: HTMLVideoElement,
    onFrame: (blob: Blob, index: number) => void,
    intervalMs = 1000,
  ): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 320, height: 240 },
      });
      this.videoEl = videoEl;
      videoEl.srcObject = this.stream;
      await videoEl.play();

      this.canvas = document.createElement("canvas");
      this.canvas.width = 320;
      this.canvas.height = 240;

      let frameIndex = 1;
      this.captureInterval = setInterval(() => {
        if (!this.canvas || !this.videoEl) return;
        const ctx = this.canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(this.videoEl, 0, 0, 320, 240);
        this.canvas.toBlob(
          (blob) => blob && onFrame(blob, frameIndex++),
          "image/jpeg",
          0.7,
        );
      }, intervalMs);
      return true;
    } catch {
      return false;
    }
  }

  stop() {
    if (this.captureInterval) clearInterval(this.captureInterval);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.videoEl) {
      this.videoEl.srcObject = null;
      this.videoEl = null;
    }
    this.canvas = null;
  }
}
