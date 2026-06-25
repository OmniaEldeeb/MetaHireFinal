"use client";

import { useSearchParams } from "next/navigation";
import { InterviewController } from "@/components/interview/interview-controller";

export default function NewInterviewPage() {
  const params = useSearchParams();
  const interviewId = params.get("interview_id");
  return (
    <InterviewController
      preloadInterviewId={interviewId ? Number(interviewId) : undefined}
    />
  );
}