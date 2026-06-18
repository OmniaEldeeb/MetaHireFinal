# Step 1 — Candidate Interview feature: fixes & TTS

Scope: **only** the Candidate-side Interview module (UI + logic + API wiring).
No other features were touched.

## Files changed
- `src/lib/api/endpoints/interview.ts`
- `src/lib/interview/recorder.ts`
- `src/lib/interview/orchestrator.ts`
- `src/lib/interview/tts.ts` *(new)*
- `src/components/interview/interview-controller.tsx`
- `src/components/interview/interview-room.tsx`
- `src/components/interview/live-signals.tsx`

## Bugs fixed

1. **Wrong history endpoint.** List page called `GET /interview/history`; the
   documented route (API docs §7.16) is `GET /interviews`. Would have 404'd.

2. **First question text empty.** `POST /ai-interview/{id}/start` returns
   `question_text` (§7.9) but the client read `question`, so Q1 showed blank
   (and TTS had nothing to read). Added response normalizers that map all
   documented field variants onto the internal shape:
   `question_text↔question`, `next_question_text↔next_question`,
   `feedback↔answer_feedback`, `summary↔overall_feedback`,
   `final_score↔overall_score`.

3. **Truncated answer audio.** The recorder shared one buffer between live
   tone-chunk streaming and the final answer; chunk streaming drained it every
   interval, so `stop()` returned only the trailing fragment. Whisper received a
   clipped answer. Split into `pendingChunks` (streamed) + `fullChunks` (whole
   answer).

4. **Webcam / expression scoring never started.** `setup()` started the camera
   with `videoRef.current`, but the `<video>` lives in `InterviewRoom`, which
   mounts later — and it was only rendered once `webcamGranted` was already
   true (chicken-and-egg). Split `startWebcam()` out of `setup()`; the
   controller starts it via an effect once the room is mounted; `LiveSignals`
   now always renders the `<video>` (placeholder overlaid when unavailable).

5. **Chunk cadence mismatch.** Tone was 4s / face 1s; docs specify tone every
   3s (§7.4) and face every 5s (§7.7). Aligned both.

## Extra requirement — Text-to-Speech
- New `src/lib/interview/tts.ts`: Web Speech API wrapper, en/ar voice
  selection, async voice loading, SSR-safe (no-ops where unavailable).
- The question is read aloud automatically when it appears, with **Replay** and
  **Mute** controls. Speech cancels when recording starts and on unmount.
- Session language flows Setup → orchestrator state → room → TTS.

## Verification
- Syntax checked all changed files via the TypeScript transpiler (no errors).
- A full `tsc` / `next build` was not run here because `node_modules` is not
  installed and network access is disabled in this environment. Recommend
  running `npm install && npm run build` locally to confirm the type-check.

---

# Follow-up — "Could not transcribe audio" on submit

Reported: submitting an answer (mic working) showed a full-screen
**"Couldn't start — Could not transcribe audio"** error, and the only action
("Try again") restarted the whole interview.

Two problems, both fixed:

1. **Unrecoverable failure wiped the session.** Any answer-submit error pushed
   the orchestrator into the `error` phase, which renders the setup-style error
   screen. A transcription error or network blip on a single answer now keeps
   the candidate on the **same question** with an inline message and a
   **"Re-record answer"** button — the interview is no longer lost.
   (`error` phase is still used for genuine setup failures like denied mic.)

2. **More reliable answer audio.** The recorder now records with the timeslice
   form `MediaRecorder.start(chunkMs)` instead of manual `requestData()` calls.
   Timeslice chunks are guaranteed to concatenate into a single valid file,
   which avoids producing a recording the server's transcriber can't decode.
   Also added an **empty-audio guard**: if no audio is captured, the candidate
   is asked to re-record instead of sending an empty file.

New state field `submitError` carries the recoverable message to the UI.

### If it still says "could not transcribe"
That exact text originates on the **backend** (Whisper). If it persists after
this build, the audio is reaching the server but can't be decoded there —
check that the transcription service's `ffmpeg` supports WebM/Opus (the format
Chrome records), or have the endpoint accept/convert the uploaded `audio.webm`.
The frontend now sends a valid, complete WebM and fails gracefully if the
server rejects it.


---

# Follow-up — incomplete report (Tone/Expression "—", missing per-question scores)

Reported with the real backend payload: the report showed "—" for Tone and
Expression, and per-question scores/feedback were missing.

Root cause: the report UI read different field names than the backend returns.

| UI field            | Backend field         |
|---------------------|-----------------------|
| `tone_score`        | `s_tone`              |
| `face_score`        | `s_face`              |
| `overall_score`     | `final_score`         |
| `overall_feedback`  | `ai_feedback`         |
| question `score`    | question `answer_score`   |
| question `feedback` | question `answer_feedback`|

Fixes:
- `normalizeReport()` now maps every one of these aliases onto the UI shape,
  including per-question `answer_score`/`answer_feedback`, `audio_url`,
  `question_number`, and `total_questions`/`questions_answered`.
- `interviewApi.report()` now fetches **both** `GET /interview/{id}` (the rich
  record that actually carries the scores + per-question data) and
  `GET /ai-interview/{id}/report`, merges them (record wins for scores), and
  normalizes. If only one succeeds it still renders; if both fail it errors.
- Report UI additions: an `<audio>` player per question when `audio_url` is
  present, and an "X of Y questions answered" caption.
- `finalize()` now links tone/face whenever their `finish` call *settles*
  (previously it skipped linking if `finish` returned an empty body, which
  could leave `communication_score` at 0).

### If Tone/Expression still show 0 after this
The display is now correct, so a `0` means the backend stored `s_tone`/`s_face`
as 0 — i.e. the tone/face analysis didn't produce a score. Check that:
- audio/face chunks reached the FastAPI services during the session, and
- the tone service can decode the WebM/Opus chunks the browser streams (the
  same codec caveat as transcription). Each 3s tone chunk after the first is a
  continuation slice without its own header; if the service needs standalone
  decodable chunks, it should be configured to accept the streamed format.
