"use client";

/**
 * Reusable action buttons for public profile pages.
 * Handles: Connect / Follow + status display, and Message.
 *
 * Routes confirmed from NetworkController:
 *   POST   /network/connect/{userId}         → connect or follow
 *   GET    /network/status/{userId}           → { status, connection_id }
 *   DELETE /network/connections/{connId}      → disconnect / unfollow
 *   POST   /conversations { user_id }         → start or find DM
 *
 * Status values from controller:
 *   none | pending_sent | pending_received | connected | following | followed_by | self
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, UserCheck, UserX, MessageSquare, Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { networkApi } from "@/lib/api/endpoints/network";
import { messagesApi } from "@/lib/api/endpoints/messages";
import { useToastStore } from "@/stores/toast.store";
import { useAuthStore } from "@/stores/auth.store";

interface ProfileActionsProps {
  /** The user ID of the profile being viewed (candidate or company user_id) */
  userId: number;
  /** Whether this profile belongs to a company (affects button label Follow vs Connect) */
  isCompany?: boolean;
  /** Initial connection_status from the profile API response (optional pre-fill) */
  initialStatus?: string | null;
}

export function ProfileActions({ userId, isCompany = false, initialStatus }: ProfileActionsProps) {
  const router = useRouter();
  const toast = useToastStore((s) => s.push);
  const qc = useQueryClient();
  const myId = useAuthStore((s) => s.user?.id);
  const [busy, setBusy] = useState(false);
  const [msgBusy, setMsgBusy] = useState(false);

  // Don't show buttons on own profile
  if (myId === userId) return null;

  // Fetch live status from GET /network/status/{userId}
  // Seed with initialStatus from the profile API response so there's no loading flash
  const statusQ = useQuery({
    queryKey: ["network-status", userId],
    queryFn: () => networkApi.status(userId),
    initialData: initialStatus
      ? { status: initialStatus === "accepted" ? "connected" : initialStatus, connection_id: null }
      : undefined,
    staleTime: 30_000,
  });

  const status = statusQ.data?.status ?? "none";
  const connectionId = statusQ.data?.connection_id ?? null;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["network-status", userId] });
    qc.invalidateQueries({ queryKey: ["connections"] });
  };

  // POST /network/connect/{userId} → connects (candidate) or follows (company)
  const handleConnect = async () => {
    setBusy(true);
    try {
      const res = await networkApi.connect(userId);
      toast({
        kind: "success",
        title: res.type === "follow" ? "Following!" : "Request sent",
        message: res.type === "follow"
          ? "You are now following this profile."
          : "Your connection request has been sent.",
      });
      invalidate();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast({ kind: "error", title: "Action failed", message: e?.message });
    } finally { setBusy(false); }
  };

  // DELETE /network/connections/{connectionId} → disconnect or unfollow
  const handleDisconnect = async () => {
    if (!connectionId) return;
    setBusy(true);
    try {
      await networkApi.disconnect(connectionId);
      toast({
        kind: "success",
        title: isCompany ? "Unfollowed" : "Disconnected",
      });
      invalidate();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast({ kind: "error", title: "Action failed", message: e?.message });
    } finally { setBusy(false); }
  };

  // POST /conversations { user_id } → open or create conversation → navigate to /messages
  const handleMessage = async () => {
    setMsgBusy(true);
    try {
      await messagesApi.openConversation(userId);
      router.push("/messages");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast({ kind: "error", title: "Couldn't open conversation", message: e?.message });
    } finally { setMsgBusy(false); }
  };

  // ── Button states ────────────────────────────────────────────────────────

  const renderConnectionButton = () => {
    // Company profile: Follow / Following / Unfollow
    if (isCompany) {
      if (status === "following") {
        return (
          <button
            onClick={handleDisconnect}
            disabled={busy}
            className="flex h-9 items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:border-coral hover:text-coral disabled:opacity-60 transition-colors"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Following
          </button>
        );
      }
      return (
        <button
          onClick={handleConnect}
          disabled={busy || statusQ.isLoading}
          className="flex h-9 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60 transition-colors"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          Follow
        </button>
      );
    }

    // Candidate profile: Connect / Pending / Connected / Withdraw
    switch (status) {
      case "connected":
        return (
          <button
            onClick={handleDisconnect}
            disabled={busy}
            className="flex h-9 items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:border-coral hover:text-coral disabled:opacity-60 transition-colors"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
            Connected
          </button>
        );
      case "pending_sent":
        return (
          <button
            onClick={handleDisconnect}
            disabled={busy}
            className="flex h-9 items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:border-coral hover:text-coral disabled:opacity-60 transition-colors"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
            Pending
          </button>
        );
      case "pending_received":
        return (
          <button
            onClick={handleConnect}
            disabled={busy}
            className="flex h-9 items-center gap-2 rounded-xl bg-green px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60 transition-colors"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
            Accept
          </button>
        );
      default:
        return (
          <button
            onClick={handleConnect}
            disabled={busy || statusQ.isLoading}
            className="flex h-9 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60 transition-colors"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Connect
          </button>
        );
    }
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {renderConnectionButton()}
      <button
        onClick={handleMessage}
        disabled={msgBusy}
        className="flex h-9 items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:border-brand hover:text-brand disabled:opacity-60 transition-colors"
      >
        {msgBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
        Message
      </button>
    </div>
  );
}