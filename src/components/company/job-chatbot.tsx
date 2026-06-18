"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Bot, User, Loader2, CheckCircle2, Wand2, Briefcase, MapPin, Clock } from "lucide-react";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { companyJobsApi } from "@/lib/api/endpoints/company-jobs";
import { useToastStore } from "@/stores/toast.store";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface JobDraft {
  title?: string;
  location?: string;
  work_type?: string;
  work_model?: string;
  experience_level?: string;
  description?: string;
  requirements?: string[];
  skills?: string[];
  salary_range?: string;
}

export function JobChatbot() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'll help you create a job posting. Tell me about the role — what are you hiring for?",
    },
  ]);
  const [input, setInput] = useState("");
  const [convId, setConvId] = useState<string | null>(null);
  const [jobData, setJobData] = useState<JobDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ready]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setSending(true);
    try {
      const res = await companyJobsApi.chatbot({
        message: msg,
        conversation_id: convId,
      });
      setConvId(res.conversation_id);
      // Only add assistant message if there's meaningful content
      if (res.response?.trim()) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: res.response },
        ]);
      }
      if (res.ready_to_create && res.job_data) {
        setJobData(res.job_data as JobDraft);
        setReady(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const confirm = async () => {
    if (!jobData || !convId || confirming) return;
    setConfirming(true);
    try {
      await companyJobsApi.confirmChatbotJob({
        conversation_id: convId,
        job_data: jobData,
      });
      qc.invalidateQueries({ queryKey: ["company-jobs"] });
      toast({ kind: "success", title: "Job posted via AI chatbot!" });
      router.push("/company/jobs");
    } catch {
      toast({ kind: "error", title: "Couldn't confirm job. Please try again." });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Container className="max-w-2xl py-8">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
          <Wand2 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            AI job creation
          </h1>
          <p className="text-sm text-muted">
            Describe the role in plain language — the AI will draft the posting.
          </p>
        </div>
      </div>

      {/* Chat messages */}
      <div className="mt-6 space-y-4 overflow-y-auto rounded-2xl border border-line bg-surface p-5"
        style={{ maxHeight: "50vh" }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <Bot className="h-4 w-4" />
              </span>
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-brand text-white"
                : "bg-elevated text-ink"
            }`}>
              {m.content}
            </div>
            {m.role === "user" && (
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <User className="h-4 w-4" />
              </span>
            )}
          </div>
        ))}
        {/* Typing indicator — shows while waiting for slow API response */}
        {sending && (
          <div className="flex gap-3">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
              <Bot className="h-4 w-4" />
            </span>
            <div className="rounded-2xl bg-elevated px-4 py-3 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Job draft preview — shown when AI has collected all required info */}
      {ready && jobData && (
        <div className="mt-4 rounded-2xl border border-brand/20 bg-brand-soft/30 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Job draft ready — review before publishing
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            {jobData.title && (
              <div className="flex items-start gap-2">
                <Briefcase className="h-4 w-4 shrink-0 mt-0.5 text-faint" />
                <div>
                  <p className="font-semibold text-sm">{jobData.title}</p>
                  {jobData.experience_level && (
                    <p className="text-xs text-muted capitalize">{jobData.experience_level.replace("_", " ")} level</p>
                  )}
                </div>
              </div>
            )}
            {(jobData.location || jobData.work_model) && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-faint" />
                {[jobData.location, jobData.work_model].filter(Boolean).join(" · ")}
              </div>
            )}
            {jobData.work_type && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <Clock className="h-3.5 w-3.5 shrink-0 text-faint" />
                {jobData.work_type.replace("_", " ")}
              </div>
            )}
            {jobData.salary_range && (
              <p className="text-xs text-muted">💰 {jobData.salary_range}</p>
            )}
            {jobData.skills?.length ? (
              <div className="flex flex-wrap gap-1 pt-1">
                {jobData.skills.slice(0, 6).map((s) => (
                  <span key={s} className="rounded-lg bg-brand-soft px-2 py-0.5 text-xs text-brand">{s}</span>
                ))}
                {jobData.skills.length > 6 && (
                  <span className="text-xs text-faint">+{jobData.skills.length - 6} more</span>
                )}
              </div>
            ) : null}
            {jobData.description && (
              <p className="text-xs text-muted line-clamp-3 pt-1 border-t border-line">
                {jobData.description}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={confirm}
              disabled={confirming}
              className="flex-1"
            >
              {confirming ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Publishing…</>
              ) : "Publish job"}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setReady(false); setJobData(null); }}
              disabled={confirming}
            >
              Edit
            </Button>
          </div>
        </div>
      )}

      {/* Input — disabled while sending or after ready (unless editing) */}
      {!ready && (
        <>
          <div className="mt-4 flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Describe the role…"
              disabled={sending}
              className="h-11 flex-1 rounded-xl border border-line bg-surface px-4 text-sm outline-none focus:border-brand disabled:opacity-50"
            />
            <Button onClick={send} disabled={!input.trim() || sending}>
              {sending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-faint">
            Or{" "}
            <a href="/company/jobs/new" className="text-brand hover:underline">
              fill in the form manually
            </a>
          </p>
        </>
      )}
    </Container>
  );
}
