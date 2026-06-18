"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, Pencil, Users, ToggleRight, ToggleLeft } from "lucide-react";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { companyJobsApi } from "@/lib/api/endpoints/company-jobs";
import { useToastStore } from "@/stores/toast.store";
import type { Job } from "@/lib/api/endpoints/jobs";

export default function CompanyJobDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const { data, isLoading } = useQuery({ queryKey: ["company-job", id], queryFn: () => companyJobsApi.getJob(id) });
  const job = data ? (("id" in (data as object)) ? data as Job : (data as { job?: Job }).job) : null;

  const toggle = async () => {
    try {
      await companyJobsApi.toggleJob(id);
      qc.invalidateQueries({ queryKey: ["company-job", id] });
      qc.invalidateQueries({ queryKey: ["company-jobs"] });
      toast({ kind: "success", title: "Job updated" });
    } catch { toast({ kind: "error", title: "Toggle failed" }); }
  };

  if (isLoading) return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>;
  if (!job) return <Container className="py-16 text-center text-sm text-muted">Job not found.</Container>;

  return (
    <Container className="max-w-3xl py-8">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">{job.title}</h1>
          <span className={`readout mt-2 inline-block rounded-full px-2.5 py-0.5 text-[0.65rem] uppercase tracking-wider ${job.is_active ? "bg-green/12 text-green" : "bg-elevated text-faint"}`}>
            {job.is_active ? "Active" : "Paused"}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" href={`/company/jobs/${id}/applicants`}><Users className="h-4 w-4" />Applicants</Button>
          <Button variant="outline" size="sm" href={`/company/jobs/${id}/edit`}><Pencil className="h-4 w-4" />Edit</Button>
          <Button variant="outline" size="sm" onClick={toggle}>
            {job.is_active ? <ToggleRight className="h-4 w-4 text-green" /> : <ToggleLeft className="h-4 w-4" />}
            {job.is_active ? "Pause" : "Activate"}
          </Button>
        </div>
      </div>
      {job.description && <div className="mt-6 rounded-2xl border border-line bg-surface p-6"><p className="whitespace-pre-line text-sm leading-relaxed text-muted">{job.description}</p></div>}
      {job.requirements?.length ? (
        <div className="mt-4 rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-base font-bold">Requirements</h2>
          <ul className="mt-3 space-y-1.5">{job.requirements.map((r,i)=><li key={i} className="flex gap-2 text-sm text-muted">· {r}</li>)}</ul>
        </div>
      ) : null}
    </Container>
  );
}
