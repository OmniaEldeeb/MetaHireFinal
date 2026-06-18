"use client";

import Link from "next/link";
import {
  Briefcase, FileText, Mic, ArrowRight, UserRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/ui/section";
import { useAuthStore } from "@/stores/auth.store";
import { useNotificationsStore } from "@/stores/notifications.store";
import { jobsApi, normalizeJobs } from "@/lib/api/endpoints/jobs";

export function CandidateDashboard() {
  const user = useAuthStore((s) => s.user);
  const unread = useNotificationsStore((s) => s.unreadCount);
  const jobsQ = useQuery({ queryKey: ["jobs-count"], queryFn: () => jobsApi.list({ active_only: "true", per_page: 1 }), staleTime: 60_000 });
  const { total: jobCount } = normalizeJobs(jobsQ.data);
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const cards = [
    { icon: Briefcase, label: "Open roles", href: "/jobs", value: jobCount > 0 ? jobCount : "Browse", color: "bg-brand-soft text-brand" },
    { icon: UserRound, label: "Your profile", href: "/profile", value: "Edit", color: "bg-green/12 text-green" },
    { icon: FileText, label: "Applications", href: "/applications", value: "Track", color: "bg-amber/12 text-amber" },
    { icon: Mic, label: "AI interview", href: "/interviews", value: "Practice", color: "bg-coral/12 text-coral" },
  ];

  return (
    <Container className="py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Hey, {firstName} 👋</h1>
          <p className="mt-1.5 text-muted">Find your next role, track applications, and nail the interview.</p>
        </div>
        {unread > 0 ? (
          <Link href="/notifications" className="shrink-0 rounded-xl border border-line bg-surface px-3.5 py-2 text-sm hover:border-brand">
            🔔 <span className="font-medium text-brand">{unread} new</span>
          </Link>
        ) : null}
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.href + c.label} href={c.href}
            className="group relative flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft">
            <span className={`grid h-11 w-11 place-items-center rounded-xl ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{c.label}</p>
              {c.value !== undefined
                ? <p className="readout text-xl font-bold text-ink">{c.value}</p>
                : null}
            </div>
            <ArrowRight className="absolute right-4 top-4 h-4 w-4 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
          </Link>
        ))}
      </div>
    </Container>
  );
}
