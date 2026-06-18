<div align="center">

<img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" />
<img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
<img src="https://img.shields.io/badge/Laravel_Reverb-Real--time-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" />

<br /><br />

# MetaHire — Web

**AI-powered hiring platform. Reads answers, voice tone, and expression. Hiring on evidence, not gut.**

[Live Demo](#) &nbsp;·&nbsp; [Backend Repo](#) &nbsp;·&nbsp; [Report a Bug](#) &nbsp;·&nbsp; [Request a Feature](#)

</div>

---

## Overview

MetaHire is a full-stack hiring platform with an AI interview engine that simultaneously evaluates what a candidate *says*, *how* they say it (voice tone), and *how they present themselves* (facial expression). Candidates get fair, evidence-based evaluation. Companies get ranked applicants with detailed analysis — with no manual screening effort required.

This repository is the **Next.js web frontend**, connected to a Laravel backend via REST API and real-time WebSockets.

---

## Features

### For Candidates
- **AI Practice Interviews** — voice-recorded Q&A scored in real time, with ideal answers and per-question feedback
- **Voice Tone Analysis** — emotion and confidence detected from audio chunks while you answer
- **Facial Expression Scoring** — webcam frames analyzed for engagement and composure
- **AI CV Builder** — generate a tailored PDF/DOCX CV from your profile, with a full analysis report (score, strengths, gaps, suggestions)
- **Application Tracking** — every application status updated in real time
- **Saved Jobs** — bookmark roles and apply on your terms

### For Companies
- **Job Posting** — full form or conversational AI chatbot that drafts a complete posting from plain-language input
- **Automatic Screening** — every applicant's CV is scored on arrival; AI interviews add answer + tone + expression scores
- **Ranked Pipeline** — applicants sorted by composite score with a one-click 8-stage status pipeline
- **Auto-Invite** — set score thresholds and let MetaHire advance the strongest candidates automatically
- **Interview Scheduling** — set a time window, candidates confirm; supports in-person, online, and phone formats
- **Team Management** — invite teammates by email, assign roles (owner / HR / member)

### Platform
- **Social Feed** — posts with reactions (5 types), comments, shares, and media
- **Network** — connections, follows, suggestions, and pending requests
- **Real-time Messaging** — conversation threads with file/media attachments
- **Live Notifications** — badge counters and toasts driven by WebSocket events
- **Global Search** — jobs, people, companies, and posts with autocomplete
- **Support Tickets** — create, reply, and close, with threaded support responses

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.6 (strict) |
| Styling | Tailwind CSS 3.4 + CSS variable design tokens |
| Server state | TanStack Query v5 |
| Client state | Zustand v5 |
| Forms | react-hook-form + zod |
| Real-time | Laravel Reverb via `laravel-echo` + `pusher-js` |
| Auth | Cookie-based Bearer token (never `localStorage`) |
| HTTP | Axios with response-envelope unwrap + 401/422/429 interceptors |

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # login, register, forgot-password
│   ├── (app)/                    # all authenticated routes
│   ├── (public)/                 # /jobs, /jobs/[id] — no auth required
│   ├── (legal)/                  # /privacy, /terms
│   └── page.tsx                  # Landing page
│
├── components/
│   ├── landing/                  # 11-section marketing page + signup modal
│   ├── app/                      # AppShell, Sidebar, Topbar, NotificationBell
│   ├── auth/                     # AuthGuard, GoogleButton
│   ├── ui/                       # Button, Input, Skeleton, ErrorBoundary, Toaster
│   ├── profile/                  # Candidate + company editors, public views
│   ├── jobs/                     # JobCard, JobsBoard, JobDetail
│   ├── cv/                       # CvManager, UploadModal, BuildModal, ReportModal
│   ├── applications/             # ApplicationsManager, ApplyModal
│   ├── company/                  # Dashboard, JobForm, Chatbot, ApplicantsList
│   ├── interview/                # Setup, Room, Controller, LiveSignals, Report
│   ├── social/                   # Feed, PostCard, ReactionBar, CommentsSection
│   ├── network/                  # NetworkPage (connections, pending, suggestions)
│   ├── messages/                 # MessagesPage (split-pane, real-time thread)
│   ├── search/                   # SearchPage with autocomplete
│   ├── support/                  # SupportPage, CreateTicketModal, TicketDrawer
│   └── providers/                # Theme, Query, Auth, Realtime, RateLimit, Prefetch
│
├── lib/
│   ├── api/
│   │   ├── client.ts             # Axios instance — envelope unwrap, interceptors
│   │   ├── session.ts            # Token storage (cookie + memory)
│   │   └── endpoints/            # 16 typed endpoint modules
│   ├── constants/
│   │   ├── enums.ts              # Single source of truth for all backend enums
│   │   └── labels.ts             # Human-readable labels for every enum value
│   ├── interview/
│   │   ├── orchestrator.ts       # 9-step interview sequence manager
│   │   ├── recorder.ts           # MediaRecorder wrapper (audio chunks + answer blob)
│   │   └── webcam.ts             # Canvas-based JPEG frame capture
│   ├── hooks/                    # useDebounce, useReveal, useIntersection, useAuth
│   ├── realtime/                 # Reverb Echo factory (lazy-loaded)
│   └── content/                  # Landing page copy and nav config
│
├── stores/                       # auth, notifications, messages, toast
└── middleware.ts                 # Route protection + auth redirect
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- The [MetaHire Laravel backend](#) running locally or deployed

### Installation

```bash
git clone https://github.com/your-username/metahire-web
cd metahire-web
npm install
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
# Backend API base URL
NEXT_PUBLIC_API_BASE_URL=https://your-backend.com/api

# Google Sign-In — use the Web client ID (not the Android one)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_web_client_id.apps.googleusercontent.com

# Laravel Reverb real-time WebSockets
NEXT_PUBLIC_REVERB_APP_KEY=your_app_key
NEXT_PUBLIC_REVERB_HOST=your_reverb_host
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=http
```

> **ngrok users:** the Axios client already sends `ngrok-skip-browser-warning: true` on every request. Update `NEXT_PUBLIC_API_BASE_URL` each time the ngrok URL rotates (free tier changes on every restart).

### Run

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # ESLint check
```

---

## Deployment

### Vercel

1. Push to GitHub and import the repo in [Vercel](https://vercel.com)
2. Add all `NEXT_PUBLIC_*` variables in **Project Settings → Environment Variables**
3. Set `NEXT_PUBLIC_API_BASE_URL` to your production backend URL (not ngrok)
4. Set `NEXT_PUBLIC_REVERB_PORT=443` and `NEXT_PUBLIC_REVERB_SCHEME=https` for production
5. Deploy

### Google Sign-In origins

Add your domains to **Authorized JavaScript origins** in Google Cloud Console (`APIs & Services → Credentials → your OAuth client`):

```
http://localhost:3000
https://your-project.vercel.app
https://your-custom-domain.com
```

---

## Key Architecture Decisions

### Enums — single source of truth

`src/lib/constants/enums.ts` is the only place backend enum values are defined. Notably, the real backend's `experience_level` field has **12 values** (`intern`, `entry`, `junior`, `mid`, `senior`, `lead`, `staff`, `principal`, `manager`, `director`, `vp`, `executive`) while the API documentation only lists 5. This file reflects the actual backend validation rules.

### Token storage

The API requires tokens never be stored in `localStorage`. Tokens are stored in a client-side cookie (SameSite=Lax, Secure in production) and mirrored to an in-memory variable for fast synchronous reads. The middleware reads the cookie server-side to protect routes without a client round-trip.

### Real-time — Reverb, not Pusher

The backend runs **Laravel Reverb** despite the API docs referring to "Pusher". Reverb is Pusher-protocol compatible, so `laravel-echo` + `pusher-js` work as the client — but the Echo initialisation uses `broadcaster: "reverb"` with the correct host and port. The real-time module is lazy-loaded via dynamic imports, adding zero weight to the landing page bundle.

### Interview orchestrator

`src/lib/interview/orchestrator.ts` manages the strict 9-step sequence the API requires: session start → tone start → face start → first question, then parallel chunk streaming during the interview (audio chunks to the tone endpoint, video frames to the face endpoint, answer blobs to the Q&A endpoint), and finally a finish/link/finalize teardown sequence. It uses a publish-subscribe pattern so the React component subscribes to state changes without the orchestrator depending on React.

### API response normalization

Several endpoints return either a paginated Laravel response `{ data: [], current_page, last_page, total }` or a plain array. Every endpoint module ships a normalizer function that handles both shapes so components never need to branch on the response type.

---

## API Coverage

All 20 sections of the backend API are implemented.

| Section | Coverage |
|---|---|
| Foundation (envelopes, auth header, error codes) | Complete |
| Authentication (login, register, Google, OTP reset) | Complete |
| Profile (candidate + company + locations + team) | Complete |
| Jobs — public browsing | Complete |
| Company — job management | Complete |
| Applications — candidate side | Complete |
| Applications — company side | Complete |
| CV management (upload, build, report, compare, trash) | Complete |
| Interview system (AI Q&A + tone + face + report) | Complete |
| Social feed | Complete |
| Network & connections | Complete |
| Messaging | Complete |
| Notifications | Complete |
| Search (full + autocomplete) | Complete |
| Support tickets | Complete |
| Device tokens (push notifications) | Scaffolded |
| Company chatbot (AI job creation) | Complete |
| Real-time WebSockets (Reverb) | Complete |
| Meta endpoints | Complete |
| Error handling (401 / 422 / 429) | Complete |

---

## Known Gotchas

**ngrok free tier** exposes only one port. Reverb runs on a separate port (8080), so for remote real-time testing you need a second tunnel for Reverb, or run the frontend locally pointing at the ngrok API.

**CV build endpoints** return a `Blob` (file), not JSON. They are downloaded directly using a helper function rather than parsed as an API response.

**Interview audio codec** — Chrome is recommended. The recorder prefers WebM/Opus. Firefox falls back to Ogg; ensure the backend accepts both if Firefox support is needed.

**Messaging route order** — `GET /conversations/unread-count` is called before opening a conversation thread. This is intentional: the API docs note a server-side route-registration order that causes conflicts if a conversation ID is fetched first.

---

## Contributing

1. Fork the repository and create a feature branch: `git checkout -b feature/your-feature`
2. Follow existing patterns — typed endpoints in `src/lib/api/endpoints/`, enum values only in `src/lib/constants/enums.ts`
3. Run `npm run lint` and `npm run build` before opening a pull request
4. Open a pull request with a clear description of what changed and why

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
Built in Egypt 🇪🇬
</div>
