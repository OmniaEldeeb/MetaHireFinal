import { create } from "zustand";

/**
 * Tracks the number of in-flight API requests app-wide. Incremented when a
 * request is sent and decremented when it resolves — success OR failure — via
 * the apiRequest() wrapper in lib/api/client.ts. The global progress bar reads
 * `pending` to show/hide itself.
 */
interface NetworkState {
  pending: number;
  inc: () => void;
  dec: () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  pending: 0,
  inc: () => set((s) => ({ pending: s.pending + 1 })),
  dec: () => set((s) => ({ pending: Math.max(0, s.pending - 1) })),
}));