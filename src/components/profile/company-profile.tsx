"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/section";
import { Tabs } from "@/components/ui/tabs";
import { companyApi } from "@/lib/api/endpoints/company";
import { CompanyInfoForm } from "./company-info-form";
import { CompanyLocations } from "./company-locations";
import { CompanyTeam } from "./company-team";

const TABS = [
  { key: "info", label: "Company" },
  { key: "locations", label: "Locations" },
  { key: "team", label: "Team" },
];

export function CompanyProfile() {
  const [tab, setTab] = useState("info");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["me-company"],
    queryFn: companyApi.me,
    staleTime: 0,
    refetchOnMount: true,
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }
  if (isError || !data?.company) {
    return (
      <Container className="py-16 text-center text-sm text-muted">
        Couldn&apos;t load your company. Please refresh.
      </Container>
    );
  }

  return (
    <Container className="max-w-3xl py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Company profile
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage your public page, offices, and team.
          </p>
        </div>
        <Link
          href={`/companies/${data.company.id}`}
          className="hidden items-center gap-1.5 text-sm font-medium text-brand hover:underline sm:inline-flex"
        >
          View public page
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      <div className="mt-6">
        {tab === "info" ? <CompanyInfoForm key={`${data.company.id}-${data.company.tagline ?? ""}`} company={data.company} /> : null}
        {tab === "locations" ? <CompanyLocations /> : null}
        {tab === "team" ? <CompanyTeam /> : null}
      </div>
    </Container>
  );
}