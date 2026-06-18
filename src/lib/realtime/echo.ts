/**
 * Real-time uses Laravel REVERB (not Pusher). Reverb speaks the Pusher
 * protocol, so the client libs are `laravel-echo` + `pusher-js` with a
 * `broadcaster: "reverb"` config. Lazy-loaded so guest/landing pages ship
 * zero realtime weight.
 */
export interface RealtimeChannel {
  subscription?: {
    bind_global?: (cb: (eventName: string, data: unknown) => void) => void;
  };
  listen: (event: string, cb: (data: unknown) => void) => RealtimeChannel;
}

export interface PresenceChannel extends RealtimeChannel {
  here: (cb: (members: unknown[]) => void) => PresenceChannel;
  joining: (cb: (member: unknown) => void) => PresenceChannel;
  leaving: (cb: (member: unknown) => void) => PresenceChannel;
}

export interface EchoLike {
  private: (name: string) => RealtimeChannel;
  join: (name: string) => PresenceChannel;
  leave: (name: string) => void;
  disconnect: () => void;
}

export async function createEcho(token: string): Promise<EchoLike> {
  const [{ default: Echo }, { default: Pusher }] = await Promise.all([
    import("laravel-echo"),
    import("pusher-js"),
  ]);

  (window as unknown as { Pusher: unknown }).Pusher = Pusher;

  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http";
  const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080);

  // NEXT_PUBLIC_API_BASE_URL ends in /api (e.g. https://host/api).
  // The broadcasting auth route lives INSIDE the api group: /api/broadcasting/auth
  // Do NOT strip /api — just strip any trailing slash.
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api")
    .replace(/\/$/, "");

  return new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? "myapp-key",
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? "127.0.0.1",
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${apiBase}/broadcasting/auth`,  // → /api/broadcasting/auth ✅
    auth: { headers: { Authorization: `Bearer ${token}` } },
  }) as unknown as EchoLike;
}
