"use client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Container } from "@/components/ui/section";
import { JobForm } from "@/components/company/job-form";
import { companyJobsApi } from "@/lib/api/endpoints/company-jobs";
import type { Job } from "@/lib/api/endpoints/jobs";

export default function EditJobPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const { data, isLoading } = useQuery({ queryKey: ["company-job", id], queryFn: () => companyJobsApi.getJob(id) });
  const job = data ? (("id" in (data as object)) ? data as Job : (data as { job?: Job }).job) : null;
  if (isLoading) return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>;
  return <Container className="max-w-3xl py-8"><JobForm job={job ?? undefined} /></Container>;
}
