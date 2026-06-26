"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Send, Paperclip, Search, ArrowLeft,
  MessageSquare, X, Plus, UserSearch,
} from "lucide-react";
import { cn, imgUrl } from "@/lib/utils";
import { Container } from "@/components/ui/section";
import { messagesApi, type Conversation, type Message } from "@/lib/api/endpoints/messages";
import { useAuthStore } from "@/stores/auth.store";
import { useMessagesStore } from "@/stores/messages.store";
import { useToastStore } from "@/stores/toast.store";
import { createEcho } from "@/lib/realtime/echo";
import { getToken } from "@/lib/api/session";

function timeAgo(iso?: string) {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

// ── Thread ───────────────────────────────────────────────────────────────────
function MessageThread({
  conversationId,
  otherId,
  onBack,
}: {
  conversationId: number;
  otherId?: number;
  onBack: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.push);
  const qc = useQueryClient();
  const setUnread = useMessagesStore((s) => s.setUnreadCount);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => messagesApi.messages(conversationId),
    refetchInterval: 120_000, // 2 min — WebSocket handles real-time delivery
  });
  const messages = [...(data?.items ?? [])].reverse();

  // Subscribe to conversation.{id} WebSocket channel for real-time delivery.
  // Per WS docs: private channel `conversation.{conversationId}`, event `.message.sent`
  // Payload: { id, conversation_id, sender: {...}, body, media_url, media_type, created_at }
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let echoInstance: Awaited<ReturnType<typeof createEcho>> | null = null;
    createEcho(token).then((echo) => {
      echoInstance = echo;
      echo.private(`conversation.${conversationId}`).listen(".message.sent", () => {
        // Invalidate query to fetch the new message; avoids duplicating state
        qc.invalidateQueries({ queryKey: ["messages", conversationId] });
        qc.invalidateQueries({ queryKey: ["conversations"] });
        // unread count updated globally by realtime-provider
      });
    }).catch(() => { /* WS unavailable — polling covers us */ });

    return () => {
      try {
        echoInstance?.leave(`conversation.${conversationId}`);
        echoInstance?.disconnect();
      } catch { /* ignore */ }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // unread count is kept fresh by realtime-provider — no local polling needed

  const send = useCallback(async () => {
    if (!body.trim() && !mediaFile) return;
    setSending(true);
    try {
      await messagesApi.send(conversationId, body.trim() || null, mediaFile ?? undefined);
      setBody("");
      setMediaFile(null);
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    } catch {
      toast({ kind: "error", title: "Send failed" });
    } finally {
      setSending(false);
    }
  }, [body, mediaFile, conversationId, qc, toast]);

  const isMine = (m: Message) => m.sender_id === user?.id;

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      {/* Header */}
      <div className="flex h-14 items-center gap-3 border-b border-line bg-surface px-4">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-xl text-faint hover:text-ink lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="font-semibold">Conversation</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
          </div>
        ) : messages.length === 0 ? (
          <div className="grid place-items-center py-10 text-center">
            <MessageSquare className="h-8 w-8 text-faint" />
            <p className="mt-2 text-sm text-muted">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn("flex", isMine(m) ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm",
                  isMine(m)
                    ? "bg-brand text-white"
                    : "bg-elevated text-ink",
                )}
              >
                {m.body && <p className="leading-relaxed">{m.body}</p>}
                {m.media_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgUrl(m.media_url) ?? ""} alt="" className="mt-2 rounded-xl max-w-xs" />
                )}
                <p className={cn("mt-1 text-[0.65rem]", isMine(m) ? "text-white/60" : "text-faint")}>
                  {timeAgo(m.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Media preview */}
      {mediaFile && (
        <div className="flex items-center gap-2 border-t border-line bg-surface px-4 py-2">
          <span className="text-sm text-muted truncate">{mediaFile.name}</span>
          <button onClick={() => setMediaFile(null)} className="text-faint hover:text-coral">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-line bg-surface px-4 py-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="grid h-9 w-9 place-items-center rounded-xl text-faint hover:bg-elevated hover:text-ink"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input ref={fileRef} type="file" className="hidden"
          onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)} />

        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Type a message…"
          className="flex-1 rounded-xl border border-line bg-elevated px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
        <button
          onClick={send}
          disabled={(!body.trim() && !mediaFile) || sending}
          className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white disabled:opacity-40 hover:bg-brand-strong"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Conversation list ────────────────────────────────────────────────────────
function ConversationList({
  selected,
  onSelect,
}: {
  selected: number | null;
  onSelect: (conv: Conversation) => void;
}) {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const [search, setSearch] = useState("");
  const [newMode, setNewMode] = useState(false);  // true = searching for new conversation
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<{ id: number; display_name?: string; display_image?: string | null; headline?: string | null; conversation_id?: number | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.conversations(),
    refetchInterval: 120_000, // 2 min — WebSocket handles real-time delivery
  });
  const convs = data?.items ?? [];

  // Search for users to start a new conversation (GET /conversations/search-users)
  useEffect(() => {
    if (!newMode || userSearch.trim().length < 2) { setUserResults([]); return; }
    setSearching(true);
    messagesApi.searchUsers(userSearch.trim())
      .then((users) => setUserResults(users as typeof userResults))
      .catch(() => setUserResults([]))
      .finally(() => setSearching(false));
  }, [newMode, userSearch]);

  const startOrOpen = async (userId: number, existingConvId?: number | null) => {
    if (starting) return;
    if (existingConvId) {
      // Existing conversation — just open it
      const existing = convs.find((c) => c.id === existingConvId);
      if (existing) { onSelect(existing); setNewMode(false); setUserSearch(""); return; }
    }
    setStarting(true);
    try {
      const res = await messagesApi.startConversation(userId);
      const convId = (res as unknown as { conversation_id?: number }).conversation_id;
      const otherUser = (res as unknown as { other_user?: Record<string, unknown> }).other_user;
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setNewMode(false);
      setUserSearch("");
      if (convId) {
        // Build a minimal Conversation object so we can open the thread immediately
        // without waiting for the conversations list to refresh
        const minimalConv: Conversation = {
          id: convId,
          other_user: otherUser as Conversation["other_user"],
          last_message_at: null,
          unread_count: 0,
          latest_message: null,
        };
        onSelect(minimalConv);
      }
    } catch {
      toast({ kind: "error", title: "Couldn't start conversation" });
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="flex h-full flex-col border-r border-line">
      <div className="p-3 space-y-2">
        {/* Search / New conversation toggle */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-elevated px-3">
            <Search className="h-4 w-4 text-faint" />
            {newMode ? (
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name or email…"
                autoFocus
                className="flex-1 bg-transparent py-2.5 text-sm outline-none"
              />
            ) : (
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="flex-1 bg-transparent py-2.5 text-sm outline-none"
              />
            )}
          </div>
          <button
            onClick={() => { setNewMode((v) => !v); setUserSearch(""); setSearch(""); }}
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-colors",
              newMode
                ? "border-brand bg-brand text-white"
                : "border-line bg-elevated text-faint hover:text-ink"
            )}
            title={newMode ? "Cancel" : "New conversation"}
          >
            {newMode ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* New conversation user search results */}
        {newMode ? (
          userSearch.trim().length < 2 ? (
            <div className="grid place-items-center gap-2 py-10 text-center">
              <UserSearch className="h-7 w-7 text-faint" />
              <p className="text-sm text-muted">Type a name or email to search</p>
            </div>
          ) : searching ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
            </div>
          ) : userResults.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No users found</p>
          ) : (
            <ul className="divide-y divide-line">
              {userResults.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => startOrOpen(u.id, u.conversation_id)}
                    disabled={starting}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-elevated disabled:opacity-60"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft text-sm font-bold text-brand">
                      {u.display_image
                        ? <img src={imgUrl(u.display_image) ?? ""} alt="" className="h-full w-full object-cover" />
                        : (u.display_name ?? "?").charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.display_name}</p>
                      {u.headline && <p className="truncate text-xs text-muted">{u.headline}</p>}
                    </span>
                    {u.conversation_id && (
                      <span className="readout text-[0.6rem] text-brand">existing</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : isLoading ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
          </div>
        ) : convs.length === 0 ? (
          <div className="grid place-items-center gap-2 py-10 text-center">
            <MessageSquare className="h-7 w-7 text-faint" />
            <p className="text-sm text-muted">No conversations yet.</p>
            <button
              onClick={() => setNewMode(true)}
              className="mt-1 text-xs text-brand hover:underline"
            >
              Start a new conversation
            </button>
          </div>
        ) : (
          convs
            .filter((c) =>
              !search || c.other_user?.display_name?.toLowerCase().includes(search.toLowerCase()),
            )
            .map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left transition-colors hover:bg-elevated",
                  selected === conv.id && "bg-brand-soft",
                )}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-elevated text-sm font-bold text-brand">
                  {conv.other_user?.display_image
                    ? <img src={imgUrl(conv.other_user.display_image) ?? ""} alt="" className="h-full w-full object-cover" />
                    : conv.other_user?.display_name?.charAt(0) ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold">
                      {conv.other_user?.display_name ?? "User"}
                    </p>
                    <span className="readout text-[0.65rem] text-faint">
                      {timeAgo(conv.last_message_at ?? undefined)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted">
                    {conv.latest_message?.body ?? "Media"}
                  </p>
                </div>
                {conv.unread_count ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[0.65rem] font-bold text-white">
                    {conv.unread_count}
                  </span>
                ) : null}
              </button>
            ))
        )}
      </div>
    </div>
  );
}

// ── Messenger root ───────────────────────────────────────────────────────────
export function MessagesPage() {
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  return (
    <div className="flex h-[calc(100dvh-4rem)] overflow-hidden">
      {/* Sidebar — always visible on desktop, hidden on mobile when thread open */}
      <div className={cn("w-full flex-col lg:flex lg:w-80 xl:w-96", selectedConv ? "hidden lg:flex" : "flex")}>
        <div className="flex h-14 items-center border-b border-line px-4">
          <h1 className="font-display text-lg font-bold tracking-tight">Messages</h1>
        </div>
        <ConversationList
          selected={selectedConv?.id ?? null}
          onSelect={setSelectedConv}
        />
      </div>

      {/* Thread */}
      <div className={cn("flex-1", selectedConv ? "flex flex-col" : "hidden lg:flex lg:items-center lg:justify-center")}>
        {selectedConv ? (
          <MessageThread
            conversationId={selectedConv.id}
            otherId={selectedConv.other_user?.id}
            onBack={() => setSelectedConv(null)}
          />
        ) : (
          <div className="text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-faint" />
            <p className="mt-3 text-sm text-muted">
              Select a conversation to start chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}