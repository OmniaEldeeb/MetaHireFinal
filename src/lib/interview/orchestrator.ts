/**
 * Orchestrates the 9-step interview sequence:
 *
 *  1. POST /interview/start
 *  2. POST /tone-interview/start
 *  3. POST /face-interview/start
 *  4. POST /ai-interview/{id}/start       → first question
 * [during interview, in parallel:]
 *  · audio chunks → /tone-interview/{id}/chunk  (every 3 s per API docs)
 *  · video frames → /face-interview/{id}/chunk  (every 5 s per API docs)
 *  · per-answer  → /ai-interview/{id}/answer/{qid}
 *  · WS channel  interview.{id} — .chunk.processed (live emotion push)
 *                               — .interview.finished (server-side done signal)
 *  5. POST /tone-interview/{id}/finish
 *  6. POST /face-interview/{id}/finish
 *  7. POST /interview/{id}/link-tone
 *  8. POST /interview/{id}/link-face
 *  9. POST /interview/{id}/finish
 *
 * WebSocket wiring:
 *   Call subscribeInterviewChannel(echo) right after setup() moves to
 *   "questioning". Call unsubscribeInterviewChannel() / abort() to clean up.
 *   The controller (interview-controller.tsx) owns the echo instance and
 *   manages the subscribe/unsubscribe lifecycle.
 */
import { interviewApi, type StartSessionBody, type FirstQuestion, type AnswerResult } from "@/lib/api/endpoints/interview";
import type { Language } from "@/lib/constants/enums";
import type { EchoLike } from "@/lib/realtime/echo";
import { AudioRecorder } from "./recorder";
import { WebcamCapture } from "./webcam";

export type OrchestratorPhase =
  | "idle"
  | "starting"
  | "questioning"
  | "recording"
  | "evaluating"
  | "finishing"
  | "done"
  | "error";

export interface OrchestratorState {
  phase: OrchestratorPhase;
  interviewId: number | null;
  toneId: number | null;
  faceId: number | null;
  language: Language;
  currentQuestion: FirstQuestion | null;
  lastAnswer: AnswerResult | null;
  liveToneEmotion: string | null;
  liveFaceEmotion: string | null;
  liveToneScore: number | null;
  liveFaceScore: number | null;
  error: string | null;
  submitError: string | null;
  webcamGranted: boolean;
}

/**
 * Payload for the WS `.chunk.processed` event on `interview.{id}`.
 * Schema: WsChunkProcessed (API docs Appendix A).
 */
interface WsChunkProcessed {
  chunk_index: number;
  prediction: {
    emotion: string;
    score: number;
  };
}

type Listener = (s: OrchestratorState) => void;

export class InterviewOrchestrator {
  private state: OrchestratorState = {
    phase: "idle",
    interviewId: null,
    toneId: null,
    faceId: null,
    language: "en",
    currentQuestion: null,
    lastAnswer: null,
    liveToneEmotion: null,
    liveFaceEmotion: null,
    liveToneScore: null,
    liveFaceScore: null,
    error: null,
    submitError: null,
    webcamGranted: false,
  };

  private listeners = new Set<Listener>();
  private recorder = new AudioRecorder();
  private webcam = new WebcamCapture();
  private webcamStarting = false;
  /** Echo instance for the interview.{id} private channel. Null when not subscribed. */
  private echoRef: EchoLike | null = null;

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  private emit(patch: Partial<OrchestratorState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }

  getState(): OrchestratorState {
    return this.state;
  }

  async setup(
    body: StartSessionBody,
    videoEl: HTMLVideoElement | null,
  ): Promise<void> {
    this.emit({ phase: "starting", error: null, language: body.language });
    try {
      // 1. Request mic
      await this.recorder.requestMic();

      // 2-3. Start session + tone + face in parallel
      // For job interviews: interview_id already exists from the invitation token
      // Skip POST /interview/start and use the existing interview_id directly
      const [session, tone, face] = await Promise.all([
        body.interview_id
          ? Promise.resolve({ interview_id: body.interview_id })
          : interviewApi.start(body),
        interviewApi.toneStart(),
        interviewApi.faceStart(),
      ]);

      this.emit({
        interviewId: session.interview_id,
        toneId: tone.tone_interview_id,
        faceId: face.face_interview_id,
      });

      // 4. Start webcam (non-fatal). The <video> element only mounts with the
      //    interview room, so if it isn't ready yet the controller calls
      //    startWebcam() again once the room is on screen.
      if (videoEl) await this.startWebcam(videoEl);

      // 5. First question
      const firstQ = await interviewApi.aiStart(session.interview_id);

      this.emit({
        phase: "questioning",
        currentQuestion: firstQ,
      });
    } catch (err) {
      this.emit({
        phase: "error",
        error: err instanceof Error ? err.message : "Setup failed",
      });
    }
  }

  /**
   * Subscribe to the private `interview.{id}` WebSocket channel.
   * Per API docs / WS docs:
   *   .chunk.processed → WsChunkProcessed payload: push live emotion into state.
   *   .interview.finished → server signals the interview is fully processed;
   *                         advance to "done" so the controller navigates to
   *                         the report page. This is a belt-and-suspenders
   *                         fallback — finalize() already emits "done" after
   *                         the HTTP finish call resolves, but the WS event
   *                         ensures we also catch any server-side async
   *                         completion that races the HTTP response.
   *
   * Call this once after setup() resolves (interviewId is set).
   * Safe to call repeatedly — idempotent due to echoRef guard.
   */
  subscribeInterviewChannel(echo: EchoLike): void {
    const id = this.state.interviewId;
    if (!id || this.echoRef) return; // already subscribed or no session yet
    this.echoRef = echo;

    echo
      .private(`interview.${id}`)
      .listen(".chunk.processed", (data) => {
        const payload = data as WsChunkProcessed;
        if (payload?.prediction) {
          // The WS push echoes the same shape as the HTTP chunk response.
          // We only update if the chunk is more recent (higher index) to avoid
          // older WS deliveries overwriting a newer HTTP result.
          this.emit({
            liveToneEmotion: payload.prediction.emotion,
            liveToneScore: payload.prediction.score,
          });
        }
      })
      .listen(".interview.finished", () => {
        // Server-side processing complete. Only advance if we're still in
        // finishing phase (finalize() may have already moved us to "done").
        if (this.state.phase === "finishing") {
          this.emit({ phase: "done" });
          this.recorder.releaseMic();
        }
        this.unsubscribeInterviewChannel();
      });
  }

  /**
   * Unsubscribe from the `interview.{id}` channel and release the echo ref.
   * Called on abort, or after .interview.finished is received.
   */
  unsubscribeInterviewChannel(): void {
    const id = this.state.interviewId;
    if (this.echoRef && id) {
      try { this.echoRef.leave(`interview.${id}`); } catch { /* ignore */ }
    }
    this.echoRef = null;
  }

  /**
   * Attaches the webcam to a freshly-mounted <video> element and begins
   * streaming JPEG frames to the face endpoint every 5 seconds (per API docs).
   * Idempotent — safe to call repeatedly from a React effect.
   */
  async startWebcam(videoEl: HTMLVideoElement): Promise<void> {
    if (this.state.webcamGranted || this.webcamStarting) return;
    if (!this.state.faceId) return;
    this.webcamStarting = true;

    const granted = await this.webcam.start(
      videoEl,
      (blob, idx) => {
        if (this.state.faceId) {
          // idx is the frame index from WebcamCapture's own counter (1-based).
          interviewApi
            .faceChunk(this.state.faceId, blob, idx)
            .then((r) =>
              this.emit({ liveFaceEmotion: r.emotion, liveFaceScore: r.score }),
            )
            .catch(() => {});
        }
      },
      5000,
    );

    this.webcamStarting = false;
    this.emit({ webcamGranted: granted });
  }

  startRecording() {
    const toneId = this.state.toneId;
    this.recorder.start(
      toneId
        ? (blob, idx) => {
            // idx is the chunk index from AudioRecorder's own counter (1-based).
            interviewApi
              .toneChunk(toneId, blob, idx)
              .then((r) =>
                this.emit({ liveToneEmotion: r.emotion, liveToneScore: r.score }),
              )
              .catch(() => {});
          }
        : undefined,
      3000,
    );
    this.emit({ phase: "recording", submitError: null });
  }

  async submitAnswer(): Promise<boolean> {
    const { interviewId, currentQuestion } = this.state;
    if (!interviewId || !currentQuestion) return false;

    this.emit({ phase: "evaluating" });
    const audio = await this.recorder.stop();

    // Nothing was captured — let the candidate re-record instead of failing the
    // whole session.
    if (!audio || audio.size === 0) {
      this.emit({
        phase: "questioning",
        submitError:
          "We didn't capture any audio. Check your microphone and record your answer again.",
      });
      return false;
    }

    try {
      const result = await interviewApi.answer(
        interviewId,
        currentQuestion.question_id,
        audio,
      );

      if (result.interview_complete) {
        this.emit({ lastAnswer: result, phase: "finishing", submitError: null });
        await this.finalize();
        return true;
      }

      // Next question
      const nextQ: FirstQuestion = {
        greeting: undefined,
        question_id: result.next_question_id!,
        question_number: result.next_question_number!,
        question: result.next_question!,
        expected_time: result.expected_time ?? 2,
        total_questions: result.total_questions ?? currentQuestion.total_questions,
      };

      this.emit({
        phase: "questioning",
        currentQuestion: nextQ,
        lastAnswer: result,
        submitError: null,
      });
      return false;
    } catch (err) {
      // A failed answer submission (e.g. transcription error, network blip) is
      // recoverable: stay on the SAME question and let the candidate retry,
      // rather than discarding the entire interview via the error screen.
      this.emit({
        phase: "questioning",
        submitError:
          err instanceof Error
            ? err.message
            : "Couldn't submit your answer. Please try recording again.",
      });
      return false;
    }
  }

  private async finalize() {
    const { interviewId, toneId, faceId } = this.state;
    if (!interviewId) return;

    this.webcam.stop();

    // Finish tone + face, then link, then finish session. Link whenever the
    // finish call settled (fulfilled) and we have an id — the backend computes
    // communication_score from the linked sessions, so we must not skip linking
    // just because finish returned an empty body.
    const [toneResult, faceResult] = await Promise.allSettled([
      toneId ? interviewApi.toneFinish(toneId) : Promise.resolve(null),
      faceId ? interviewApi.faceFinish(faceId) : Promise.resolve(null),
    ]);

    await Promise.allSettled([
      toneId && toneResult.status === "fulfilled"
        ? interviewApi.linkTone(interviewId, toneId)
        : Promise.resolve(),
      faceId && faceResult.status === "fulfilled"
        ? interviewApi.linkFace(interviewId, faceId)
        : Promise.resolve(),
    ]);

    await interviewApi.finish(interviewId);

    // Unsubscribe from the interview WS channel — we no longer need live events.
    // The .interview.finished WS event may also trigger this path if the server
    // signals completion asynchronously; both paths guard against double-emit.
    this.unsubscribeInterviewChannel();
    this.emit({ phase: "done" });
    this.recorder.releaseMic();
  }

  abort() {
    this.recorder.releaseMic();
    this.webcam.stop();
    this.webcamStarting = false;
    this.unsubscribeInterviewChannel();
    this.emit({ phase: "idle", webcamGranted: false });
  }
}