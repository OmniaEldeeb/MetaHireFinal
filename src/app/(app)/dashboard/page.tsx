"use client";

import { useAuthStore } from "@/stores/auth.store";
import { CompanyDashboard } from "@/components/company/company-dashboard";
import { CandidateDashboard } from "@/components/app/candidate-dashboard";

export default function DashboardPage() {
  const role = useAuthStore((s) => s.role);
  return role === "company" ? <CompanyDashboard /> : <CandidateDashboard />;
}
