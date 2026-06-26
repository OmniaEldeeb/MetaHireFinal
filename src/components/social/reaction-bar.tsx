"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bold,
  Bookmark,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  HandHeart,
  Heart,
  Italic,
  Laugh,
  Link2,
  List,
  Loader2,
  Lock,
  MessageSquare,
  Repeat2,
  Search,
  Send,
  Share2,
  Star,
  ThumbsUp,
  Users,
  X,
} from "lucide-react";
import { cn, imgUrl } from "@/lib/utils";
import { PostContent } from "@/components/social/post-content";
import { socialApi } from "@/lib/api/endpoints/social";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const REACTION_ICONS: Record<string, typeof ThumbsUp> = {
  like: ThumbsUp, love: Heart, celebrate: Star, support: HandHeart, funny: Laugh,
};
const REACTION_COLORS: Record<string, string> = {
  like: "text-brand", love: "text-coral", celebrate: "text-amber",
  support: "text-green", funny: "text-amber",
};

// ── Who reposted popup ───────────────────────────────────────────────────────
function ShareUsersModal({ postId, total, onClose }: { postId: number; total: number; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["share-users", postId],
    queryFn: () => socialApi.shareUsers(postId),
    staleTime: 30_000,
  });

  type RepostItem = {
    user: { id: number; role: string; display_name: string; display_image?: string | null; headline?: string | null };
    comment?: string | null;
    reposted_at: string;
    post_id: number;
  };

  // shareUsers returns { total, reposts: Paginator{data:[...]} }
  // After API client unwraps: data.reposts is the paginator object, extract .data array
  const repostsRaw = data?.reposts as unknown;
  const reposts: RepostItem[] = Array.isArray(repostsRaw)
    ? (repostsRaw as RepostItem[])
    : Array.isArray((repostsRaw as { data?: unknown })?.data)
      ? ((repostsRaw as { data: RepostItem[] }).data)
      : [];

  return (
    <div
      className="fixed inset-0 z-[400] flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="modal-in w-full max-w-sm overflow-hidden rounded-3xl border border-line2 bg-surface shadow-lift mb-4 sm:mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="font-display text-sm font-bold tracking-tight">
            {total} Repost{total !== 1 ? "s" : ""}
          </h3>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-faint hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div>
          ) : reposts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No reposts yet</p>
          ) : (
            <ul className="divide-y divide-line">
              {reposts.map((r, i) => {
                const href = r.user.role === "company" ? `/companies/${r.user.id}` : `/users/${r.user.id}`;
                return (
                  <li key={i} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <a href={href} className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-elevated">
                        {r.user.display_image
                          ? <img src={imgUrl(r.user.display_image) ?? ""} alt="" className="h-full w-full object-cover" />
                          : <span className="text-sm font-bold text-brand">{r.user.display_name?.charAt(0)}</span>}
                      </a>
                      <div className="min-w-0 flex-1">
                        <a href={href} className="truncate text-sm font-medium hover:underline block">{r.user.display_name}</a>
                        {r.user.headline && <p className="truncate text-xs text-muted">{r.user.headline}</p>}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="mt-1.5 pl-12 text-xs text-muted line-clamp-2">{r.comment}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
function ReactionsModal({ postId, onClose }: { postId: number; onClose: () => void }) {
  const [tab, setTab] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["reaction-users", postId],
    queryFn: () => socialApi.reactionUsers(postId),
    staleTime: 30_000,
  });

  const allUsers = Object.values(data?.by_type ?? {}).flat();
  const tabs = [
    { key: "all", label: `All ${data?.total ?? ""}`, users: allUsers },
    ...Object.entries(data?.by_type ?? {})
      .filter(([, users]) => users.length > 0)
      .map(([type, users]) => ({ key: type, label: type, users })),
  ];

  const current = tabs.find((t) => t.key === tab) ?? tabs[0];

  return (
    <div
      className="fixed inset-0 z-[400] flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="modal-in w-full max-w-sm overflow-hidden rounded-3xl border border-line2 bg-surface shadow-lift mb-4 sm:mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="font-display text-sm font-bold tracking-tight">Reactions</h3>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-faint hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Reaction type tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2">
          {tabs.map((t) => {
            const Icon = REACTION_ICONS[t.key];
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === t.key ? "bg-elevated text-ink" : "text-muted hover:text-ink"
                )}
              >
                {Icon && <Icon className={cn("h-3.5 w-3.5", REACTION_COLORS[t.key])} />}
                {t.key === "all" ? t.label : `${t.label} ${data?.counts?.[t.key] ?? ""}`}
              </button>
            );
          })}
        </div>

        {/* Users list */}
        <div className="max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
            </div>
          ) : (current?.users ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No reactions yet</p>
          ) : (
            <ul className="divide-y divide-line">
              {(current?.users ?? []).map(({ user, reacted_at }, i) => {
                const Icon = REACTION_ICONS[tab !== "all" ? tab : "like"];
                const href = user.role === "company" ? `/companies/${user.id}` : `/users/${user.id}`;
                return (
                  <li key={`${user.id}-${i}`} className="flex items-center gap-3 px-4 py-3">
                    <a href={href} className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-elevated">
                      {user.display_image
                        ? <img src={imgUrl(user.display_image) ?? ""} alt="" className="h-full w-full object-cover" />
                        : <span className="text-sm font-bold text-brand">{user.display_name?.charAt(0)}</span>}
                    </a>
                    <div className="min-w-0 flex-1">
                      <a href={href} className="truncate text-sm font-medium hover:underline block">{user.display_name}</a>
                      {user.headline && <p className="truncate text-xs text-muted">{user.headline}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
import { messagesApi } from "@/lib/api/endpoints/messages";
import { useToastStore } from "@/stores/toast.store";
import { useDebounced } from "@/lib/hooks/use-debounce";
import type { ReactionType } from "@/lib/constants/enums";

const REACTIONS: { type: ReactionType; icon: typeof ThumbsUp; label: string; color: string }[] = [
  { type: "like",      icon: ThumbsUp,  label: "Like",      color: "text-brand" },
  { type: "love",      icon: Heart,     label: "Love",      color: "text-coral" },
  { type: "celebrate", icon: Star,      label: "Celebrate", color: "text-amber" },
  { type: "support",   icon: HandHeart, label: "Support",   color: "text-green" },
  { type: "funny",     icon: Laugh,     label: "Funny",     color: "text-amber" },
];

type ShareMode = "menu" | "repost" | "direct";
type SearchUser = {
  id: number;
  display_name?: string;
  display_image?: string | null;
  headline?: string | null;
  role?: string;
  conversation_id?: number | null;
};

// ── Share modal ───────────────────────────────────────────────────────────────
function ShareModal({
  postId,
  onClose,
}: {
  postId: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToastStore((s) => s.push);
  const qc = useQueryClient();
  const [mode, setMode] = useState<ShareMode>("menu");
  const [busy, setBusy] = useState(false);

  // Repost state
  const [repostCaption, setRepostCaption] = useState("");
  const [repostPreview, setRepostPreview] = useState(false);
  const repostTaRef = useRef<HTMLTextAreaElement>(null);
  const [visibility, setVisibility] = useState<"public" | "connections" | "private">("public");

  // Direct send state
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected]   = useState<SearchUser | null>(null);
  const [caption, setCaption]     = useState("");
  const [sent, setSent]           = useState(false);           // true after successful send
  const [sentConvId, setSentConvId] = useState<number | null>(null);
  const debouncedQ = useDebounced(query, 300);

  // Search users when query changes (min 2 chars)
  useEffect(() => {
    if (debouncedQ.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    messagesApi.searchUsers(debouncedQ.trim())
      .then((users) => setResults(users as SearchUser[]))
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, [debouncedQ]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const copyLink = async () => {
    setBusy(true);
    try {
      const res = await socialApi.shareLink(postId);
      const url = res.url ?? window.location.href;
      await navigator.clipboard.writeText(url);
      qc.invalidateQueries({ queryKey: ["feed"] }); // refresh shares_count
      toast({ kind: "success", title: "Link copied!" });
      onClose();
    } catch {
      toast({ kind: "error", title: "Couldn't copy link" });
    } finally { setBusy(false); }
  };

  const repost = async () => {
    setBusy(true);
    try {
      await socialApi.shareRepost(postId, visibility, repostCaption);
      qc.invalidateQueries({ queryKey: ["feed"] }); // new repost appears + original shares_count updates
      toast({ kind: "success", title: "Reposted to your feed" });
      onClose();
    } catch {
      toast({ kind: "error", title: "Repost failed" });
    } finally { setBusy(false); }
  };

  // Send post as DM — uses POST /posts/{id}/share type=direct
  // Controller (confirmed): creates/finds conversation, sends message with post URL + caption
  // Returns { sent_to: N } and the conversation is the existing one (conversation_id from searchUsers)
  const sendDirect = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await socialApi.shareDirect(postId, [selected.id], caption);
      setSent(true);
      // If searchUsers returned a conversation_id, we can deep-link straight to it
      setSentConvId(selected.conversation_id ?? null);
      toast({ kind: "success", title: `Sent to ${selected.display_name ?? "user"}` });
    } catch {
      toast({ kind: "error", title: "Send failed" });
    } finally { setBusy(false); }
  };

  const goToConversation = () => {
    onClose();
    router.push("/messages");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[400] flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="modal-in w-full max-w-sm overflow-hidden rounded-3xl border border-line2 bg-surface shadow-lift mb-4 sm:mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="font-display text-sm font-bold tracking-tight">
            {mode === "repost" ? "Repost" : mode === "direct" ? "Send to someone" : "Share"}
          </h3>
          <button
            onClick={mode === "menu" ? onClose : () => { setMode("menu"); setSent(false); setSelected(null); setQuery(""); }}
            className="grid h-7 w-7 place-items-center rounded-lg text-faint hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Menu ── */}
        {mode === "menu" && (
          <div className="p-3 space-y-1">
            <button onClick={copyLink} disabled={busy}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-elevated disabled:opacity-60">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <Link2 className="h-4 w-4" />
              </span>
              <span className="text-left">
                <p className="font-medium">Copy link</p>
                <p className="text-xs text-muted">Share a link to this post</p>
              </span>
            </button>

            <button onClick={() => setMode("repost")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-elevated">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-green/10 text-green">
                <Repeat2 className="h-4 w-4" />
              </span>
              <span className="text-left">
                <p className="font-medium">Repost</p>
                <p className="text-xs text-muted">Share to your feed with a comment</p>
              </span>
            </button>

            <button onClick={() => setMode("direct")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-elevated">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber/10 text-amber">
                <Send className="h-4 w-4" />
              </span>
              <span className="text-left">
                <p className="font-medium">Send to someone</p>
                <p className="text-xs text-muted">Send in a conversation</p>
              </span>
            </button>
          </div>
        )}

        {/* ── Repost ── */}
        {mode === "repost" && (
          <div className="p-4 space-y-3">
            {/* Markdown toolbar */}
            <div className="flex items-center gap-0.5">
              {([
                { icon: Bold,   title: "Bold",    wrap: ["**","**","bold text"] },
                { icon: Italic, title: "Italic",  wrap: ["*","*","italic"] },
                { icon: List,   title: "List",    wrap: ["- ","","item"] },
              ] as { icon: React.ElementType; title: string; wrap: [string,string,string] }[]).map(({ icon: Icon, title, wrap }) => (
                <button key={title} type="button" title={title}
                  onClick={() => {
                    const ta = repostTaRef.current;
                    if (!ta) return;
                    const s = ta.selectionStart, e = ta.selectionEnd;
                    const sel = repostCaption.slice(s, e) || wrap[2];
                    const next = repostCaption.slice(0, s) + wrap[0] + sel + wrap[1] + repostCaption.slice(e);
                    setRepostCaption(next);
                    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + wrap[0].length, s + wrap[0].length + sel.length); }, 0);
                  }}
                  className="grid h-7 w-7 place-items-center rounded-lg text-faint hover:bg-elevated hover:text-ink"
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
              <button type="button" onClick={() => setRepostPreview((v) => !v)}
                className="ml-auto flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-faint hover:bg-elevated hover:text-ink">
                {repostPreview ? <><EyeOff className="h-3.5 w-3.5" /> Edit</> : <><Eye className="h-3.5 w-3.5" /> Preview</>}
              </button>
            </div>
            {repostPreview ? (
              <div className="min-h-[72px] rounded-xl border border-line bg-elevated px-3 py-2.5 text-sm">
                {repostCaption.trim()
                  ? <PostContent content={repostCaption} contentFormat="markdown" />
                  : <span className="text-faint">Nothing to preview yet…</span>}
              </div>
            ) : (
              <textarea
                ref={repostTaRef}
                value={repostCaption}
                onChange={(e) => setRepostCaption(e.target.value)}
                placeholder="Add a comment… (optional) — Markdown supported"
                rows={3}
                className="w-full resize-none rounded-xl border border-line bg-elevated px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            )}
            {/* Visibility picker */}
            <div className="flex gap-2">
              {(["public", "connections", "private"] as const).map((v) => {
                const icons = { public: Globe, connections: Users, private: Lock };
                const Icon = icons[v];
                return (
                  <button key={v} onClick={() => setVisibility(v)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium capitalize transition-colors",
                      visibility === v
                        ? "border-brand bg-brand text-white"
                        : "border-line text-muted hover:border-brand hover:text-brand",
                    )}>
                    <Icon className="h-3 w-3" /> {v}
                  </button>
                );
              })}
            </div>
            <button onClick={repost} disabled={busy}
              className="flex w-full h-10 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat2 className="h-4 w-4" />}
              Repost to feed
            </button>
          </div>
        )}

        {/* ── Direct send ── */}
        {mode === "direct" && (
          <div className="flex flex-col">
            {sent ? (
              /* Sent confirmation + Go to conversation button */
              <div className="p-6 text-center space-y-4">
                <span className="grid mx-auto h-14 w-14 place-items-center rounded-full bg-green/10 text-green">
                  <CheckCircle2 className="h-7 w-7" />
                </span>
                <div>
                  <p className="font-semibold text-ink">Sent!</p>
                  <p className="text-sm text-muted mt-1">
                    The post was sent to{" "}
                    <span className="font-medium">{selected?.display_name}</span>.
                  </p>
                </div>
                <button
                  onClick={goToConversation}
                  className="flex w-full h-10 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-medium text-white hover:bg-brand-strong"
                >
                  Go to conversation <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : selected ? (
              /* Selected a person — show caption input + send button */
              <div className="p-4 space-y-3">
                {/* Selected user chip */}
                <div className="flex items-center gap-3 rounded-xl border border-brand/20 bg-brand-soft/20 px-3 py-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft text-xs font-bold text-brand">
                    {selected.display_image
                      ? <img src={imgUrl(selected.display_image) ?? ""} alt="" className="h-full w-full object-cover" />
                      : (selected.display_name ?? "?").charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{selected.display_name}</p>
                    {selected.headline && <p className="text-xs text-muted truncate">{selected.headline}</p>}
                  </span>
                  <button onClick={() => setSelected(null)} className="text-faint hover:text-ink">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a message… (optional)"
                  rows={2}
                  className="w-full resize-none rounded-xl border border-line bg-elevated px-3 py-2.5 text-sm outline-none focus:border-brand"
                />

                <button
                  onClick={sendDirect}
                  disabled={busy}
                  className="flex w-full h-10 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send in conversation
                </button>
              </div>
            ) : (
              /* Search for a person */
              <div className="flex flex-col max-h-72">
                {/* Search input */}
                <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                  <Search className="h-4 w-4 shrink-0 text-faint" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name or email…"
                    autoFocus
                    className="flex-1 bg-transparent text-sm outline-none py-1"
                  />
                  {searching && <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />}
                </div>

                {/* Results */}
                <div className="overflow-y-auto">
                  {query.trim().length < 2 ? (
                    <p className="py-8 text-center text-xs text-faint">Type at least 2 characters</p>
                  ) : results.length === 0 && !searching ? (
                    <p className="py-8 text-center text-xs text-faint">No users found</p>
                  ) : (
                    <ul className="divide-y divide-line">
                      {results.map((u) => (
                        <li key={u.id}>
                          <button
                            onClick={() => setSelected(u)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-elevated"
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
                              <span className="readout text-[0.6rem] text-brand shrink-0">existing</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ReactionBar ───────────────────────────────────────────────────────────────
export function ReactionBar({
  postId,
  myReaction,
  reactionCount,
  commentCount,
  shareCount,
  onComment,
  onSave,
  saved,
}: {
  postId: number;
  myReaction?: ReactionType | null;
  reactionCount?: number;
  commentCount?: number;
  shareCount?: number;
  onComment?: () => void;
  onSave?: () => void;   // when provided, delegates save to post-card (keeps state in sync)
  saved?: boolean;
}) {
  const toast = useToastStore((s) => s.push);
  const [current, setCurrent]     = useState<ReactionType | null>(myReaction ?? null);
  const [count, setCount]         = useState(reactionCount ?? 0);
  const [showPicker, setShowPicker] = useState(false);
  const [bookmarked, setBookmarked] = useState(saved ?? false);
  const [showShare, setShowShare]  = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showShareUsers, setShowShareUsers] = useState(false);
  const [reacting, setReacting]   = useState(false);
  const [saving, setSaving]       = useState(false);

  const react = async (type: ReactionType) => {
    if (reacting) return;
    setShowPicker(false);
    setReacting(true);
    if (current === type) {
      setCurrent(null);
      setCount((c) => Math.max(0, c - 1));
      await socialApi.unreact(postId).catch(() => {
        setCurrent(type);
        setCount((c) => c + 1);
      });
    } else {
      const delta = current ? 0 : 1;
      setCurrent(type);
      setCount((c) => c + delta);
      await socialApi.react(postId, type).catch(() => {
        setCurrent(current);
        setCount((c) => c - delta);
      });
    }
    setReacting(false);
  };

  // Sync bookmarked from parent when prop changes (e.g. toggled via menu)
  useEffect(() => { setBookmarked(saved ?? false); }, [saved]);

  const save = async () => {
    if (saving) return;
    if (onSave) {
      // Delegate to post-card which owns the state
      onSave();
      setBookmarked((v) => !v); // mirror optimistic update
      return;
    }
    setSaving(true);
    try {
      const res = await socialApi.savePost(postId);
      setBookmarked(res.saved);
      toast({ kind: "success", title: res.saved ? "Post saved" : "Post unsaved" });
    } catch {
      toast({ kind: "error", title: "Couldn't save post" });
    } finally { setSaving(false); }
  };

  const active = REACTIONS.find((r) => r.type === current);

  return (
    <>
      {/* ── Counts row (like Facebook: "👍❤️⭐ 3  · 2 comments · 1 share") ── */}
      {(count > 0 || (commentCount ?? 0) > 0 || (shareCount ?? 0) > 0) && (
        <div className="flex items-center justify-between border-t border-line pt-2 pb-1 text-xs text-muted">
          {count > 0 ? (
            <button
              onClick={() => setShowReactions(true)}
              className="flex items-center gap-1 hover:underline"
            >
              <span className="flex">
                {REACTIONS.filter((r) => r.type === current || true)
                  .slice(0, 3)
                  .map((r) => (
                    <r.icon key={r.type} className={cn("h-3.5 w-3.5 -ml-0.5 first:ml-0", r.color)} />
                  ))
                  .slice(0, 1)}
              </span>
              {count}
            </button>
          ) : <span />}
          <div className="flex items-center gap-3">
            {(commentCount ?? 0) > 0 && (
              <button onClick={onComment} className="hover:underline">
                {commentCount} comment{(commentCount ?? 0) !== 1 ? "s" : ""}
              </button>
            )}
            {(shareCount ?? 0) > 0 && (
              <button onClick={() => setShowShareUsers(true)} className="hover:underline">
                {shareCount} share{(shareCount ?? 0) !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Actions row: Like · Comment · Share · Save — equal width like Facebook ── */}
      <div className="relative flex items-center border-t border-line pt-1">
        {/* Like button — full emoji picker on hover */}
        <div className="relative flex-1">
          <button
            onMouseEnter={() => !reacting && setShowPicker(true)}
            onMouseLeave={() => setShowPicker(false)}
            onClick={() => (current ? react(current) : setShowPicker((v) => !v))}
            disabled={reacting}
            className={cn(
              "flex w-full h-9 items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition-colors hover:bg-elevated disabled:opacity-60",
              active ? active.color : "text-muted",
            )}
          >
            {reacting ? <Loader2 className="h-4 w-4 animate-spin" />
              : active ? <active.icon className="h-4 w-4" />
              : <ThumbsUp className="h-4 w-4" />}
            <span className="hidden sm:inline">{active ? active.label : "Like"}</span>
          </button>

          {showPicker && !reacting && (
            <div
              className="absolute bottom-full left-0 z-20 mb-1 flex gap-1 rounded-2xl border border-line2 bg-surface px-2 py-1.5 shadow-lift"
              onMouseEnter={() => setShowPicker(true)}
              onMouseLeave={() => setShowPicker(false)}
            >
              {REACTIONS.map((r) => (
                <button key={r.type} onClick={() => react(r.type)} title={r.label}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg transition-all hover:scale-125",
                    current === r.type ? r.color + " bg-elevated" : r.color + "/70",
                  )}>
                  <r.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comment */}
        <button onClick={onComment}
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-medium text-muted hover:bg-elevated">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Comment</span>
        </button>

        {/* Share */}
        <button onClick={() => setShowShare(true)}
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-medium text-muted hover:bg-elevated">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {showShare && (
        <ShareModal postId={postId} onClose={() => setShowShare(false)} />
      )}

      {showReactions && (
        <ReactionsModal postId={postId} onClose={() => setShowReactions(false)} />
      )}

      {showShareUsers && (
        <ShareUsersModal postId={postId} total={shareCount ?? 0} onClose={() => setShowShareUsers(false)} />
      )}
    </>
  );
}