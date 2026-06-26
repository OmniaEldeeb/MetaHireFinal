"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { useNotificationsStore } from "@/stores/notifications.store";
import { useMessagesStore } from "@/stores/messages.store";
import { useToastStore } from "@/stores/toast.store";
import { getToken } from "@/lib/api/session";
import { createEcho, type EchoLike } from "@/lib/realtime/echo";
import { notificationsApi } from "@/lib/api/endpoints/notifications";
import { conversationsApi } from "@/lib/api/endpoints/conversations";

/**
 * Zero polling when WebSocket is connected.
 * One-time fallback fetch when WS is confirmed down — then nothing until reconnect.
 *
 * Pusher-js retries connections automatically, so we must NOT call refreshCounts()
 * on every state change — only once per genuine connect/disconnect transition.
 */
const FALLBACK_POLL_MS = 5 * 60 * 1000; // 5 min, only when WS is confirmed down

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore(
    (s) => (s.user as unknown as { company?: { id?: number } } | null)?.company?.id,
  );
  const qc = useQueryClient();

  // Track if the WS session is already initialized to prevent re-init on dep changes
  const initializedRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !userId) return;
    // Already set up — don't tear down and rebuild on every dep change
    if (initializedRef.current) return;
    initializedRef.current = true;

    let echo: EchoLike | null = null;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;
    let prevWsState: "unknown" | "connected" | "down" = "unknown";

    const refreshCounts = async () => {
      try {
        const [n, c] = await Promise.all([
          notificationsApi.unreadCount(),
          conversationsApi.unreadCount(),
        ]);
        useNotificationsStore.getState().setUnreadCount(n.count);
        useMessagesStore.getState().setUnreadCount(c.unread_count);
      } catch { /* ignore */ }
    };

    const onWsConnected = () => {
      if (prevWsState === "connected") return; // already connected, skip
      prevWsState = "connected";
      // Stop fallback polling — WS handles everything now
      if (fallbackInterval) { clearInterval(fallbackInterval); fallbackInterval = null; }
      // Fetch once to sync any updates missed during disconnect
      void refreshCounts();
    };

    const onWsDown = () => {
      if (prevWsState === "down") return; // already down, skip duplicate events
      prevWsState = "down";
      // Start fallback polling — only if not already running
      if (!fallbackInterval) {
        fallbackInterval = setInterval(refreshCounts, FALLBACK_POLL_MS);
      }
      // Do NOT call refreshCounts() here — the interval will handle it
    };

    /** Handle an event from user.{id} or company.{id} channel */
    const onUserEvent = (rawName: string, data: unknown) => {
      const name = String(rawName ?? "").replace(/^\./, "");
      if (name.startsWith("pusher:") || name.startsWith("pusher_internal")) return;

      const toast = useToastStore.getState().push;
      const payload = (data ?? {}) as Record<string, unknown>;

      switch (name) {
        case "notification.sent":
        case "NotificationSent":
          useNotificationsStore.getState().onIncoming(payload);
          toast({
            kind: "info",
            title: String(payload.title ?? "New notification"),
            message: payload.message ? String(payload.message) : undefined,
            href: "/notifications",
          });
          break;

        case "message.sent":
        case "MessageSent":
          useMessagesStore.getState().increment();
          qc.invalidateQueries({ queryKey: ["conversations"] });
          toast({ kind: "info", title: "New message", href: "/messages" });
          break;

        case "application.submitted":
        case "application.status_changed":
        case "application.interview_invited":
        case "application.final_invited":
        case "ApplicationUpdated":
          qc.invalidateQueries({ queryKey: ["applications"] });
          qc.invalidateQueries({ queryKey: ["company-applications"] });
          qc.invalidateQueries({ queryKey: ["all-company-applications"] });
          toast({
            kind: "info",
            title: name === "application.submitted" ? "New application received" : "Application updated",
            href: role === "company" ? "/company/applications" : "/applications",
          });
          break;

        case "cv.scored":
          qc.invalidateQueries({ queryKey: ["cvs"] });
          qc.invalidateQueries({ queryKey: ["applications"] });
          toast({ kind: "success", title: "Your CV has been scored", href: "/cv" });
          break;

        case "connection.requested":
        case "ConnectionUpdated":
          qc.invalidateQueries({ queryKey: ["network-pending"] });
          toast({ kind: "info", title: "New connection request", href: "/network" });
          break;

        case "connection.accepted":
          qc.invalidateQueries({ queryKey: ["network-connections"] });
          qc.invalidateQueries({ queryKey: ["network-pending"] });
          toast({ kind: "success", title: "Connection accepted", href: "/network" });
          break;

        case "connection.rejected":
        case "connection.removed":
          qc.invalidateQueries({ queryKey: ["network-connections"] });
          break;

        case "profile.updated":
          qc.invalidateQueries({ queryKey: ["me-profile"] });
          qc.invalidateQueries({ queryKey: ["me-company"] });
          break;

        case "final_interview.created":
        case "final_interview.updated":
        case "final_interview.cancelled":
          qc.invalidateQueries({ queryKey: ["applications"] });
          qc.invalidateQueries({ queryKey: ["company-applications"] });
          qc.invalidateQueries({ queryKey: ["all-company-applications"] });
          toast({
            kind: "info",
            title:
              name === "final_interview.cancelled" ? "Final interview cancelled" :
              name === "final_interview.created"   ? "Final interview scheduled" :
              "Final interview updated",
          });
          break;

        case "job.created":
        case "job.updated":
        case "job.deleted":
          qc.invalidateQueries({ queryKey: ["company-jobs"] });
          qc.invalidateQueries({ queryKey: ["company-dashboard"] });
          break;

        default:
          break;
      }
    };

    (async () => {
      const token = getToken();
      if (!token) return;

      let hasRefreshedOnConnect = false;

      try {
        echo = await createEcho(token);

        // Track connection state via Pusher's connection object
        const pusher = (echo as unknown as {
          connector?: { pusher?: { connection?: {
            bind: (ev: string, cb: () => void) => void;
            state: string;
          }}}
        })?.connector?.pusher;

        if (pusher?.connection) {
          const conn = pusher.connection;
          conn.bind("connected",    onWsConnected);
          conn.bind("disconnected", onWsDown);
          conn.bind("failed",       onWsDown);
          conn.bind("unavailable",  onWsDown);

          // Already connected by the time we check
          if (conn.state === "connected") onWsConnected();
        }
        // If we can't track state, just leave the one-time fetch from above

        // ── user.{id} channel ──────────────────────────────────────────
        const userChannel = echo.private(`user.${userId}`);
        const userSub = userChannel.subscription;
        if (userSub?.bind_global) {
          userSub.bind_global(onUserEvent);
        } else {
          [
            ".notification.sent", ".profile.updated",
            ".connection.requested", ".connection.accepted",
            ".connection.rejected", ".connection.removed",
            ".application.submitted", ".application.status_changed",
            ".application.interview_invited", ".application.final_invited",
            ".cv.scored", ".final_interview.created", ".final_interview.updated",
            ".final_interview.cancelled",
          ].forEach((ev) =>
            userChannel.listen(ev, (d) => onUserEvent(ev.replace(/^\./, ""), d)),
          );
        }

        // ── company.{id} channel ───────────────────────────────────────
        if (role === "company" && companyId) {
          const companyChannel = echo.private(`company.${companyId}`);
          const companySub = companyChannel.subscription;
          if (companySub?.bind_global) {
            companySub.bind_global(onUserEvent);
          } else {
            [
              ".job.created", ".job.updated", ".job.deleted",
              ".application.submitted", ".application.status_changed",
              ".cv.scored", ".final_interview.created", ".final_interview.updated",
              ".final_interview.cancelled",
            ].forEach((ev) =>
              companyChannel.listen(ev, (d) => onUserEvent(ev.replace(/^\./, ""), d)),
            );
          }
        }
      } catch {
        // WS completely failed to initialize — leave fallback polling running
        onWsDown();
      }
    })();

    return () => {
      initializedRef.current = false;
      if (fallbackInterval) clearInterval(fallbackInterval);
      try {
        echo?.leave(`user.${userId}`);
        if (role === "company" && companyId) echo?.leave(`company.${companyId}`);
        echo?.disconnect();
      } catch { /* ignore */ }
    };
  }, [status, userId, role, companyId, qc]);

  return <>{children}</>;
}