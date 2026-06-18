"use client";

import { useAuthStore } from "@/stores/auth.store";
import { CandidateProfile } from "@/components/profile/candidate-profile";
import { CompanyProfile } from "@/components/profile/company-profile";

export default function ProfilePage() {
  const role = useAuthStore((s) => s.role);
  return role === "company" ? <CompanyProfile /> : <CandidateProfile />;
}
