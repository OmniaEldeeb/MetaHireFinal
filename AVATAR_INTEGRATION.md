# 3D Avatar Integration — Interview Section

The Ready Player Me 3D avatar (with automatic lip-sync) is now integrated into
the interview room as the on-screen **AI interviewer**.

## What you'll see

When a candidate is in an interview (`/interviews/new`, or via an invitation
link), the interview room now shows a 3D interviewer at the top. While a
question is being read aloud, the avatar's lips move and it plays a talking
body animation; between questions it idles.

## Where it lives

```
src/components/interview/
├── interview-room.tsx          ← renders the avatar stage (edited)
├── interview-avatar.tsx        ← typed Next.js wrapper (new)
└── avatar-kit/                 ← the ported 3D kit (new)
    ├── Avatar.jsx              ← RPM avatar + morph-target lip-sync
    ├── Desk.jsx                ← office desk model
    ├── AvatarScene.jsx         ← self-contained R3F canvas + lighting
    ├── useSpeechLipSync.js     ← lip movement from the TTS `speaking` flag
    ├── useAudioLipSync.js      ← spectrum analysis for a real <audio> source
    ├── index.js                ← barrel export
    └── index.d.ts              ← types for the barrel

public/
├── models/      avatar.glb, office_desk.glb
├── animations/  Sitting Idle / Sitting Talking / Having A Meeting / Idle .fbx
└── textures/    youtubeBackground.jpg
```

## How the lip-sync works (important)

The interview reads questions with the browser **Web Speech API**
(`window.speechSynthesis`, see `src/lib/interview/tts.ts`). That API plays audio
straight through the OS and exposes **no** `<audio>` element or media stream, so
the kit's original spectrum-analysis hook (`useAudioLipSync`) has nothing to
read.

So the avatar is driven by **`useSpeechLipSync(speaking)`**, which synthesizes
natural-looking mouth movement from the existing TTS `speaking` state already
tracked in `interview-room.tsx`. No backend, no extra audio plumbing — the
mouth animates exactly while the question is spoken and eases shut when it ends.

### Switching to "true" audio lip-sync later

If the interview ever moves to a TTS provider that returns real audio (a URL,
base64, or Blob — e.g. ElevenLabs or a cloud TTS), swap the hook:

```jsx
const { playAudio, isPlaying, currentVisemes } = useAudioLipSync();
// ...when you have the audio: await playAudio(audioUrlOrBlob);
<AvatarScene visemes={currentVisemes} isPlaying={isPlaying} />
```

The `<Avatar>` / `<AvatarScene>` contract is identical for both hooks.

## Dependencies added

`package.json` now includes (install with `npm install`):

- `three@0.153.0`
- `@react-three/fiber@8.13.3`
- `@react-three/drei@9.75.0`
- `@types/three@0.153.0` (dev)

`next.config.mjs` adds `transpilePackages` for the three.js ecosystem.

## Design / robustness notes

- The WebGL scene is loaded **client-only** via `next/dynamic({ ssr: false })`,
  so three.js never runs during server rendering.
- An error boundary wraps the scene: on a machine without WebGL (or if a model
  fails to load) it falls back to a clean 2D "AI Interviewer" placeholder
  instead of breaking the interview.
- The remote HDR environment preset from the original kit was removed in favor
  of explicit scene lights, so the avatar renders correctly with no external
  runtime asset fetch.
- The avatar/desk models were verified to contain every node, material, and
  viseme (`viseme_O/aa/E/I`) the components reference.

## Run

```bash
npm install
npm run dev
```