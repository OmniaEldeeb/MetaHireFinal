import { create } from "zustand";

interface MessagesState {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
  increment: () => void;
}

export const useMessagesStore = create<MessagesState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: Math.max(0, n) }),
  increment: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
}));
