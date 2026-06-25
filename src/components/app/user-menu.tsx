"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Settings, ChevronDown, User, Pencil } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useLogout } from "@/lib/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { profileApi } from "@/lib/api/endpoints/profile";
import { companyApi } from "@/lib/api/endpoints/company";
import { imgUrl } from "@/lib/utils";

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const logout = useLogout();
  const [open, setOpen] = useState(false);

  // For candidates: read profile_image_url from me-profile (already cached by /profile page)
  const candidateQ = useQuery({
    queryKey: ["me-profile"],
    queryFn: profileApi.me,
    enabled: role === "candidate",
    staleTime: 5 * 60_000,
  });

  // For companies: read logo_url + company id from me-company (already cached by /profile page)
  const companyQ = useQuery({
    queryKey: ["me-company"],
    queryFn: companyApi.me,
    enabled: role === "company",
    staleTime: 5 * 60_000,
  });

  // Resolve avatar URL and public profile link based on role
  const avatarUrl: string | null | undefined =
    role === "candidate"
      ? candidateQ.data?.user?.candidate_profile?.profile_image_url
      : role === "company"
        ? companyQ.data?.company?.logo_url
        : null;

  const publicProfileHref =
    role === "candidate" && user?.id
      ? `/users/${user.id}`
      : role === "company" && companyQ.data?.company?.id
        ? `/companies/${companyQ.data.company.id}`
        : null;

  const resolvedAvatarUrl = imgUrl(avatarUrl ?? null);
  const initial = user?.name?.charAt(0) ?? "U";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-line2 bg-surface py-1.5 pl-1.5 pr-2.5 text-sm transition-colors hover:border-brand"
      >
        {/* Avatar: show real image if available, else initial */}
        <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-soft font-display text-sm font-bold text-brand">
          {resolvedAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" src={resolvedAvatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </span>
        <span className="hidden max-w-[8rem] truncate sm:block">{user?.name}</span>
        <ChevronDown className="h-4 w-4 text-faint" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-line2 bg-surface shadow-lift">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-soft font-display text-sm font-bold text-brand">
                {resolvedAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img loading="lazy" src={resolvedAvatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="truncate text-xs text-faint">{user?.email}</p>
              </div>
            </div>

            {/* View public profile */}
            {publicProfileHref && (
              <Link
                href={publicProfileHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-elevated"
              >
                <User className="h-4 w-4 text-faint" />
                View my profile
              </Link>
            )}

            {/* Edit profile */}
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-elevated"
            >
              <Pencil className="h-4 w-4 text-faint" />
              Edit profile
            </Link>

            {/* Settings */}
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-elevated"
            >
              <Settings className="h-4 w-4 text-faint" />
              Account settings
            </Link>

            {/* Logout */}
            <div className="border-t border-line">
              <button
                onClick={() => logout()}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-coral hover:bg-elevated"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}