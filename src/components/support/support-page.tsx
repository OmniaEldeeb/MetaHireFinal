"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Loader2, LifeBuoy, Plus, X, Send, CheckCircle2,
  ChevronRight, Clock, MessageSquare,
} from "lucide-react";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  supportApi,
  type Ticket,
  type TicketType,
  type TicketCategory,
  type TicketStatus,
} from "@/lib/api/endpoints/support";
import { useToastStore } from "@/stores/toast.store";

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso?: string) {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

const STATUS_COLORS: Record<TicketStatus, string> = {
  open:        "bg-brand-soft text-brand",
  in_progress: "bg-amber/12 text-amber",
  resolved:    "bg-green/12 text-green",
  closed:      "bg-elevated text-faint",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open:        "Open",
  in_progress: "In progress",
  resolved:    "Resolved",
  closed:      "Closed",
};

// ── Create ticket form ────────────────────────────────────────────────────────
interface CreateValues {
  type: TicketType;
  category: TicketCategory;
  subject: string;
  body: string;
}

const selectCls =
  "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-brand";

function CreateTicketModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateValues>({
    defaultValues: { type: "question", category: "other" },
  });

  async function onSubmit(v: CreateValues) {
    try {
      await supportApi.create(v);
      qc.invalidateQueries({ queryKey: ["tickets"] });
      toast({ kind: "success", title: "Ticket submitted" });
      onClose();
    } catch {
      toast({ kind: "error", title: "Couldn't submit ticket" });
    }
  }

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="modal-in w-full max-w-lg rounded-3xl border border-line2 bg-bg-2 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-xl font-bold tracking-tight">
            New support ticket
          </h2>
          <button onClick={onClose} className="text-faint hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" htmlFor="type">
              <select id="type" className={selectCls} {...register("type")}>
                <option value="bug">Bug</option>
                <option value="complaint">Complaint</option>
                <option value="question">Question</option>
                <option value="feature_request">Feature request</option>
              </select>
            </Field>
            <Field label="Category" htmlFor="category">
              <select id="category" className={selectCls} {...register("category")}>
                <option value="account">Account</option>
                <option value="payment">Payment</option>
                <option value="interview">Interview</option>
                <option value="job">Job</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>

          <Field label="Subject" htmlFor="subject" error={errors.subject?.message}>
            <Input
              id="subject"
              placeholder="Briefly describe your issue"
              invalid={!!errors.subject}
              {...register("subject", { required: "Subject is required" })}
            />
          </Field>

          <Field label="Details" htmlFor="body" error={errors.body?.message}>
            <Textarea
              id="body"
              rows={5}
              placeholder="Describe the problem in detail…"
              invalid={!!errors.body}
              {...register("body", { required: "Description is required" })}
            />
          </Field>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting} type="button">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit ticket
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Ticket detail drawer ──────────────────────────────────────────────────────
function TicketDrawer({ ticketId, onClose }: { ticketId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => supportApi.get(ticketId),
  });

  const sendReply = async () => {
    if (!replyBody.trim()) return;
    setSending(true);
    try {
      await supportApi.reply(ticketId, replyBody.trim());
      setReplyBody("");
      qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
      toast({ kind: "success", title: "Reply sent" });
    } catch {
      toast({ kind: "error", title: "Reply failed — ticket may be closed" });
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    setClosing(true);
    try {
      await supportApi.close(ticketId);
      qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
      toast({ kind: "success", title: "Ticket closed" });
    } catch {
      toast({ kind: "error", title: "Close failed" });
    } finally {
      setClosing(false);
    }
  };

  const isClosed = ticket?.status === "closed" || ticket?.status === "resolved";

  return (
    <div className="fixed inset-0 z-[400] flex justify-end" onClick={onClose}>
      <div
        className="modal-in flex h-full w-full max-w-md flex-col overflow-hidden border-l border-line bg-bg-2 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display text-base font-bold">Ticket #{ticketId}</h3>
          <button onClick={onClose} className="text-faint hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
            </div>
          ) : !ticket ? (
            <p className="text-sm text-muted">Couldn&apos;t load ticket.</p>
          ) : (
            <div className="space-y-5">
              {/* Meta */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[ticket.status ?? "open"])}>
                    {STATUS_LABELS[ticket.status ?? "open"]}
                  </span>
                  <span className="readout text-xs text-faint capitalize">
                    {ticket.type?.replace("_", " ")} · {ticket.category}
                  </span>
                </div>
                <h4 className="mt-3 text-base font-semibold">{ticket.subject}</h4>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                  {ticket.body}
                </p>
                <p className="mt-2 flex items-center gap-1 text-xs text-faint">
                  <Clock className="h-3 w-3" />
                  {timeAgo(ticket.created_at)}
                </p>
              </div>

              {/* Replies */}
              {ticket.replies && ticket.replies.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-faint">
                    Replies
                  </p>
                  {ticket.replies.map((r) => {
                    // Controller loads replies.user (not replies.author)
                    // Use is_staff boolean to detect support staff replies
                    const isSupport = r.is_staff === true;
                    return (
                      <div
                        key={r.id}
                        className={cn(
                          "rounded-2xl p-4 text-sm",
                          isSupport
                            ? "border border-brand/20 bg-brand-soft"
                            : "border border-line bg-elevated",
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-semibold">
                            {isSupport ? "MetaHire Support" : (r.user?.name ?? "You")}
                          </span>
                          <span className="text-xs text-faint">
                            {timeAgo(r.created_at)}
                          </span>
                        </div>
                        <p className="whitespace-pre-line leading-relaxed text-muted">
                          {r.body}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — reply + close */}
        {ticket && !isClosed && (
          <div className="space-y-3 border-t border-line p-5">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={3}
              placeholder="Add a reply…"
              className="w-full resize-none rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={sendReply} disabled={!replyBody.trim() || sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Reply
              </Button>
              <Button variant="outline" onClick={closeTicket} disabled={closing}>
                {closing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Mark resolved
              </Button>
            </div>
          </div>
        )}
        {ticket && isClosed && (
          <div className="flex items-center gap-2 border-t border-line p-5 text-sm text-faint">
            <CheckCircle2 className="h-4 w-4 text-green" />
            This ticket is {ticket.status}.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Support page ──────────────────────────────────────────────────────────────
const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "",            label: "All statuses" },
  { value: "open",        label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved",    label: "Resolved" },
  { value: "closed",      label: "Closed" },
];

export function SupportPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["tickets", statusFilter],
    queryFn: () => supportApi.list({ status: statusFilter || undefined }),
  });

  const items = tickets ?? [];

  return (
    <Container className="max-w-2xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Support</h1>
          <p className="mt-1 text-sm text-muted">
            Submit a request or track your existing tickets.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          New ticket
        </Button>
      </div>

      {/* Filter */}
      <div className="mt-5">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-brand"
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Tickets list */}
      <div className="mt-5">
        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : items.length === 0 ? (
          <div className="grid place-items-center gap-3 rounded-2xl border border-line bg-surface py-16 text-center">
            <LifeBuoy className="h-8 w-8 text-faint" />
            <p className="text-sm text-muted">No tickets yet.</p>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Submit a request
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {items.map((ticket, i) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedId(ticket.id)}
                className={cn(
                  "flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-elevated",
                  i > 0 && "border-t border-line",
                )}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <MessageSquare className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {ticket.subject ?? `Ticket #${ticket.id}`}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-faint">
                    <Clock className="h-3 w-3" />
                    {timeAgo(ticket.created_at)}
                    <span className="readout ml-1 capitalize">
                      · {ticket.type?.replace("_", " ")} · {ticket.category}
                    </span>
                    {/* replies_count from withCount('replies') on list endpoint */}
                    {ticket.replies_count !== undefined && ticket.replies_count > 0 && (
                      <span className="ml-1">· {ticket.replies_count} {ticket.replies_count === 1 ? "reply" : "replies"}</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[ticket.status ?? "open"])}>
                    {STATUS_LABELS[ticket.status ?? "open"]}
                  </span>
                  <ChevronRight className="h-4 w-4 text-faint" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateTicketModal onClose={() => setShowCreate(false)} />}
      {selectedId !== null && (
        <TicketDrawer ticketId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </Container>
  );
}
