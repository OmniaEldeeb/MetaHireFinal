"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Container } from "@/components/ui/section";
import { profileApi } from "@/lib/api/endpoints/profile";
import { CandidateProfileForm } from "./candidate-profile-form";

export function CandidateProfile() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["me-profile"],
    queryFn: profileApi.me,
    staleTime: 0,       // always refetch when page is visited
    refetchOnMount: true,
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }
  if (isError || !data?.user) {
    return (
      <Container className="py-16 text-center text-sm text-muted">
        Couldn&apos;t load your profile. Please refresh.
      </Container>
    );
  }

  return (
    <Container className="max-w-3xl py-8">
      <CandidateProfileForm key={`${data.user.id}-${data.user.candidate_profile?.headline ?? ""}-${(data.user.candidate_profile?.skills ?? []).length}`} user={data.user} />
    </Container>
  );
}