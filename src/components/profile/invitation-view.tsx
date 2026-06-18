"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Check, X } from "lucide-react";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { companyApi } from "@/lib/api/endpoints/company";
import { useToastStore } from "@/stores/toast.store";

export function InvitationView({ token }: { token: string }) {
  const router = useRouter();
  const toast = useToastStore((s) => s.push);
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function act(kind: "accept" | "decline") {
    setBusy(kind);
    try {
      if (kind === "accept") {
        await companyApi.acceptInvitation(token);
        toast({ kind: "success", title: "Invitation accepted" });
        setDone("You've joined the company.");
        setTimeout(() => router.replace("/dashboard"), 1200);
      } else {
        await companyApi.declineInvitation(token);
        toast({ kind: "info", title: "Invitation declined" });
        setDone("You declined the invitation.");
      }
    } catch {
      toast({ kind: "error", title: "This invitation is no longer valid" });
      setDone("This invitation can't be used.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Container className="max-w-md py-20">
      <div className="rounded-3xl border border-line bg-surface p-10 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Mail className="h-6 w-6" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight">
          Company invitation
        </h1>
        {done ? (
          <p className="mt-3 text-sm text-muted">{done}</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted">
              You&apos;ve been invited to join a company workspace on MetaHire.
            </p>
            <div className="mt-8 flex gap-3">
              <Button
                className="flex-1"
                disabled={busy !== null}
                onClick={() => act("accept")}
              >
                <Check className="h-4 w-4" />
                {busy === "accept" ? "Accepting…" : "Accept"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={busy !== null}
                onClick={() => act("decline")}
              >
                <X className="h-4 w-4" />
                Decline
              </Button>
            </div>
          </>
        )}
      </div>
    </Container>
  );
}
