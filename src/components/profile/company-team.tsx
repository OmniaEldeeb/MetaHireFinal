"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Loader2, Mail, Trash2, UserPlus, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { companyApi } from "@/lib/api/endpoints/company";
import { useToastStore } from "@/stores/toast.store";
import type { CompanyMember } from "@/lib/api/models";

const ROLES = ["owner", "hr", "member"];

interface InviteValues {
  email: string;
  role: string;
}

export function CompanyTeam() {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);

  const members = useQuery({
    queryKey: ["company-members"],
    queryFn: companyApi.members,
  });
  const invites = useQuery({
    queryKey: ["company-invitations"],
    queryFn: companyApi.invitations,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteValues>({ defaultValues: { role: "hr" } });

  const refreshMembers = () =>
    qc.invalidateQueries({ queryKey: ["company-members"] });
  const refreshInvites = () =>
    qc.invalidateQueries({ queryKey: ["company-invitations"] });

  async function onInvite(v: InviteValues) {
    try {
      await companyApi.invite(v);
      reset({ email: "", role: "hr" });
      refreshInvites();
      toast({ kind: "success", title: "Invitation sent" });
    } catch {
      toast({ kind: "error", title: "Couldn't send invite" });
    }
  }

  async function changeRole(m: CompanyMember, role: string) {
    try {
      await companyApi.updateMember(m.id, { role });
      refreshMembers();
      toast({ kind: "success", title: "Role updated" });
    } catch {
      toast({ kind: "error", title: "Update failed" });
    }
  }

  async function removeMember(id: number) {
    try {
      await companyApi.removeMember(id);
      refreshMembers();
      toast({ kind: "success", title: "Member removed" });
    } catch {
      toast({ kind: "error", title: "Remove failed" });
    }
  }

  async function cancelInvite(id: number) {
    try {
      await companyApi.cancelInvitation(id);
      refreshInvites();
      toast({ kind: "success", title: "Invitation cancelled" });
    } catch {
      toast({ kind: "error", title: "Cancel failed" });
    }
  }

  async function leave() {
    if (!confirm("Leave this company? You'll lose access to its workspace."))
      return;
    try {
      await companyApi.leave();
      toast({ kind: "success", title: "You left the company" });
      refreshMembers();
    } catch {
      toast({ kind: "error", title: "Couldn't leave" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Members */}
      <section className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-display text-lg font-bold tracking-tight">
          Team members
        </h2>
        {members.isLoading ? (
          <div className="grid place-items-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-faint" />
          </div>
        ) : (members.data ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-faint">No members yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {(members.data ?? []).map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                  {m.name?.charAt(0) ?? "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted">{m.email}</p>
                </div>
                <select
                  value={m.role}
                  onChange={(e) => changeRole(m, e.target.value)}
                  className="h-9 rounded-lg border border-line bg-surface px-2 text-sm capitalize outline-none focus:border-brand"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeMember(m.id)}
                  aria-label="Remove member"
                  className="text-faint hover:text-coral"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Invite */}
      <form
        onSubmit={handleSubmit(onInvite)}
        className="rounded-2xl border border-line bg-surface p-6"
        noValidate
      >
        <h3 className="font-display text-base font-bold tracking-tight">
          Invite a teammate
        </h3>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Email" htmlFor="invite-email" error={errors.email?.message}>
              <Input
                id="invite-email"
                type="email"
                placeholder="hr@company.com"
                {...register("email", { required: "Email is required" })}
              />
            </Field>
          </div>
          <Field label="Role" htmlFor="invite-role">
            <select
              id="invite-role"
              className="h-11 rounded-xl border border-line bg-surface px-3 text-sm capitalize outline-none focus:border-brand"
              {...register("role")}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Button type="submit" disabled={isSubmitting}>
            <UserPlus className="h-4 w-4" />
            Invite
          </Button>
        </div>
      </form>

      {/* Pending invitations */}
      <section className="rounded-2xl border border-line bg-surface p-6">
        <h3 className="font-display text-base font-bold tracking-tight">
          Pending invitations
        </h3>
        {invites.isLoading ? (
          <div className="grid place-items-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-faint" />
          </div>
        ) : (invites.data ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-faint">No pending invitations.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {(invites.data ?? []).map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 py-3">
                <Mail className="h-4 w-4 shrink-0 text-faint" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{inv.email}</p>
                  <p className="text-xs capitalize text-muted">{inv.role}</p>
                </div>
                <button
                  onClick={() => cancelInvite(inv.id)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-coral"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        onClick={leave}
        className="inline-flex items-center gap-2 text-sm font-medium text-coral hover:underline"
      >
        <LogOut className="h-4 w-4" />
        Leave company
      </button>
    </div>
  );
}
