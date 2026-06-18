"use client";

import { InterviewReport } from "@/components/interview/interview-report";
export default function ReportPage({ params }: { params: { id: string } }) {
  return <InterviewReport interviewId={Number(params.id)} />;
}