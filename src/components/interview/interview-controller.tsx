"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { InterviewSetup } from "./interview-setup";
import { InterviewRoom } from "./interview-room";
import { InterviewOrchestrator, type OrchestratorState } from "@/lib/interview/orchestrator";
import type { StartSessionBody } from "@/lib/api/endpoints/interview";
import { createEcho, type EchoLike } from "@/lib/realtime/echo";
import { getToken } from "@/lib/api/session";

export function InterviewController() {
  const router = useRouter();
  const orchestratorRef = useRef<InterviewOrchestrator | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [orchState, setOrchState] = useState<OrchestratorState | null>(null);
  // Echo instance for the private interview.{id} channel.
  // Created lazily once we have an interviewId; torn down on abort/done.
  const echoRef = useRef<EchoLike | null>(null);

  function getOrchestrator(): InterviewOrchestrator {
    if (!orchestratorRef.current) {
      orchestratorRef.current = new InterviewOrchestrator();
    }
    return orchestratorRef.current;
  }

  useEffect(() => {
    const orch = getOrchestrator();
    const unsub = orch.subscribe(setOrchState);
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigate to report when the orchestrator reaches "done" (either via the
  // HTTP finish path in finalize(), or via the .interview.finished WS event).
  useEffect(() => {
    if (orchState?.phase === "done" && orchState.interviewId) {
      router.push(`/interviews/${orchState.interviewId}/report`);
    }
  }, [orchState?.phase, orchState?.interviewId, router]);

  // Wire the interview.{id} WebSocket channel once we have an interviewId and
  // the session is active (questioning/recording/evaluating/finishing).
  // Per WS docs: subscribe private channel `interview.{id}`, listen for
  //   .chunk.processed  → WsChunkProcessed payload: live emotion push
  //   .interview.finished → server signals done; orchestrator advances to "done"
  // Unsubscribe automatically when the phase reaches "done"/"idle"/"error" or
  // when the component unmounts.
  useEffect(() => {
    const id = orchState?.interviewId;
    const phase = orchState?.phase;
    const activePhases = ["questioning", "recording", "evaluating", "finishing"];

    if (id && phase && activePhases.includes(phase) && !echoRef.current) {
      const token = getToken();
      if (!token) return;
      // Lazy-create a dedicated echo connection for the interview channel so it
      // doesn't interfere with the always-on user.{id} connection in RealtimeProvider.
      createEcho(token)
        .then((echo) => {
          echoRef.current = echo;
          orchestratorRef.current?.subscribeInterviewChannel(echo);
        })
        .catch(() => {
          // WebSocket unavailable — the HTTP-polling path in finalize() still works.
        });
    }

    // Tear down when the interview ends (done/idle/error) or when interviewId
    // is cleared (e.g. after reset()).
    if (!id || (phase && !activePhases.includes(phase))) {
      if (echoRef.current) {
        orchestratorRef.current?.unsubscribeInterviewChannel();
        try { echoRef.current.disconnect(); } catch { /* ignore */ }
        echoRef.current = null;
      }
    }
  }, [orchState?.interviewId, orchState?.phase]);

  // The <video> element lives inside InterviewRoom, which only mounts once the
  // interview is in progress. Start the webcam here — after the ref exists —
  // rather than during setup() when it is still null. Idempotent on the
  // orchestrator side, so retrying as the phase changes is safe.
  useEffect(() => {
    const phase = orchState?.phase;
    const inRoom =
      phase === "questioning" || phase === "recording" || phase === "evaluating";
    if (inRoom && !orchState?.webcamGranted && videoRef.current) {
      void orchestratorRef.current?.startWebcam(videoRef.current);
    }
  }, [orchState?.phase, orchState?.webcamGranted]);

  // Cleanup on unmount — abort the session and tear down the WS connection.
  useEffect(() => {
    return () => {
      orchestratorRef.current?.abort();
      if (echoRef.current) {
        try { echoRef.current.disconnect(); } catch { /* ignore */ }
        echoRef.current = null;
      }
    };
  }, []);

  const handleStart = (body: StartSessionBody) => {
    const orch = getOrchestrator();
    void orch.setup(body, videoRef.current);
  };

  const reset = () => {
    orchestratorRef.current?.abort();
    orchestratorRef.current = null;
    if (echoRef.current) {
      try { echoRef.current.disconnect(); } catch { /* ignore */ }
      echoRef.current = null;
    }
    setOrchState(null);
  };

  const phase = orchState?.phase ?? "idle";

  if (phase === "idle") return <InterviewSetup onStart={handleStart} />;

  if (phase === "starting") {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand" />
          <p className="mt-3 text-sm text-muted">Starting — requesting permissions…</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="grid min-h-[60vh] place-items-center px-5">
        <div className="max-w-md rounded-3xl border border-coral/30 bg-surface p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-coral" />
          <h2 className="mt-4 font-display text-xl font-bold">Couldn&apos;t start</h2>
          <p className="mt-2 text-sm text-muted">{orchState?.error ?? "An error occurred."}</p>
          <p className="mt-1 text-sm text-muted">Check microphone access and try again.</p>
          <button onClick={reset} className="mt-5 text-sm font-medium text-brand hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (phase === "finishing" || phase === "done") {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand" />
          <p className="mt-3 text-sm text-muted">Generating your report…</p>
        </div>
      </div>
    );
  }

  // questioning | recording | evaluating
  return (
    <InterviewRoom
      state={orchState!}
      videoRef={videoRef}
      onStartRecording={() => orchestratorRef.current?.startRecording()}
      onSubmit={async () => { await orchestratorRef.current?.submitAnswer(); }}
    />
  );
}
