"use client";

import { ApplicantsList } from "@/components/company/applicants-list";
export default function ApplicantsPage({ params }: { params: { id: string } }) {
  return <ApplicantsList jobId={Number(params.id)} />;
}