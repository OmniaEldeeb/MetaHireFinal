"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { useNotificationsStore } from "@/stores/notifications.store";
import { useMessagesStore } from "@/stores/messages.store";
import { useToastStore } from "@/stores/toast.store";
import { getToken } from "@/lib/api/session";
import { createEcho, type EchoLike } from "@/lib/realtime/echo";
import { notificationsApi } from "@/lib/api/endpoints/notifications";
import { conversationsApi } from "@/lib/api/endpoints/conversations";

const POLL_MS = 60_000; // 60s fallback — WebSocket handles real-time updates

/**
 * Mounts inside the authenticated shell. Keeps unread counts fresh via polling
 * (the reliable baseline) and layers Reverb on top for instant updates.
 *
 * Channels subscribed (per WS docs):
 *   private user.{userId}   — notifications, profile, connections, applications
 *   private company.{id}    — job/application events for company accounts
 *                             company id comes from user.company (set on login/me)
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.role);
  // company id is stored on the user object for company accounts
  const companyId = useAuthStore(
    (s) => (s.user as unknown as { company?: { id?: number } } | null)?.company?.id,
  );
  const qc = useQueryClient();

  useEffect(() => {
    if (status !== "authenticated" || !userId) return;

    let echo: EchoLike | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;

    const refreshCounts = async () => {
      try {
        const n = await notificationsApi.unreadCount();
        useNotificationsStore.getState().setUnreadCount(n.count);
      } catch { /* ignore */ }
      try {
        const c = await conversationsApi.unreadCount();
        useMessagesStore.getState().setUnreadCount(c.unread_count);
      } catch { /* ignore */ }
    };

    refreshCounts();
    interval = setInterval(refreshCounts, POLL_MS);

    /** Handle an event from the user.{id} or company.{id} channel. */
    const onUserEvent = (rawName: string, data: unknown) => {
      const name = String(rawName ?? "").replace(/^\./, "");
      if (name.startsWith("pusher:") || name.startsWith("pusher_internal")) return;

      const toast = useToastStore.getState().push;
      const payload = (data ?? {}) as Record<string, unknown>;

      switch (name) {
        // ── Notifications ─────────────────────────────────────────────────
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

        // ── Messages ──────────────────────────────────────────────────────
        case "message.sent":
        case "MessageSent":
          useMessagesStore.getState().increment();
          // Invalidate conversations list so the sidebar shows updated preview
          qc.invalidateQueries({ queryKey: ["conversations"] });
          toast({ kind: "info", title: "New message", href: "/messages" });
          break;

        // ── Applications (both candidate & company channels) ──────────────
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

        // ── CV scored (candidate gets notified when CV is processed) ──────
        case "cv.scored":
          qc.invalidateQueries({ queryKey: ["cvs"] });
          qc.invalidateQueries({ queryKey: ["applications"] });
          toast({ kind: "success", title: "Your CV has been scored", href: "/cv" });
          break;

        // ── Connections ───────────────────────────────────────────────────
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

        // ── Profile updated on another device ─────────────────────────────
        case "profile.updated":
          qc.invalidateQueries({ queryKey: ["me-profile"] });
          qc.invalidateQueries({ queryKey: ["me-company"] });
          break;

        // ── Final interview scheduling ─────────────────────────────────────
        case "final_interview.created":
        case "final_interview.updated":
        case "final_interview.cancelled":
          qc.invalidateQueries({ queryKey: ["applications"] });
          qc.invalidateQueries({ queryKey: ["company-applications"] });
          qc.invalidateQueries({ queryKey: ["all-company-applications"] });
          toast({
            kind: "info",
            title:
              name === "final_interview.cancelled"
                ? "Final interview cancelled"
                : name === "final_interview.created"
                ? "Final interview scheduled"
                : "Final interview updated",
          });
          break;

        // ── Company-side: job events ───────────────────────────────────────
        case "job.created":
        case "job.updated":
        case "job.deleted":
          qc.invalidateQueries({ queryKey: ["company-jobs"] });
          qc.invalidateQueries({ queryKey: ["company-dashboard"] });
          break;

        default:
          break;
      }

      // Always refresh unread counts after any event
      void refreshCounts();
    };

    (async () => {
      const token = getToken();
      if (!token) return;
      try {
        echo = await createEcho(token);

        // ── user.{id} channel — all roles ──────────────────────────────
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

        // ── company.{id} channel — company role only ────────────────────
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
        /* polling already covers us if the socket can't connect */
      }
    })();

    return () => {
      if (interval) clearInterval(interval);
      try {
        echo?.leave(`user.${userId}`);
        if (role === "company" && companyId) {
          echo?.leave(`company.${companyId}`);
        }
        echo?.disconnect();
      } catch { /* ignore */ }
    };
  }, [status, userId, role, companyId, qc]);

  return <>{children}</>;
}
