import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { JobsBoard } from "@/components/jobs/jobs-board";

export const metadata: Metadata = { title: "Browse jobs" };

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      }
    >
      <JobsBoard />
    </Suspense>
  );
}
