"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, PasswordInput } from "@/components/ui/input";
import { authApi } from "@/lib/api/endpoints/auth";
import { applyApiError } from "@/lib/api/auth-helpers";
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "@/lib/validation/auth";

export default function ChangePasswordPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function onSubmit(values: ChangePasswordValues) {
    setFormError(null);
    setDone(false);
    try {
      await authApi.changePassword(values);
      reset();
      setDone(true);
    } catch (err) {
      setFormError(applyApiError(err, setError));
    }
  }

  return (
    <Container className="max-w-lg py-12">
      <p className="eyebrow">Account settings</p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
        Change password
      </h1>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
        <ShieldCheck className="h-4 w-4" />
        Updating signs out your other devices.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-4 rounded-2xl border border-line bg-surface p-6"
        noValidate
      >
        {done ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-live/30 bg-live/10 px-3.5 py-3 text-sm text-live">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Password changed. Other sessions were signed out.</span>
          </div>
        ) : null}
        <FormAlert message={formError} />

        <Field
          label="Current password"
          htmlFor="current_password"
          error={errors.current_password?.message}
        >
          <PasswordInput
            id="current_password"
            autoComplete="current-password"
            invalid={!!errors.current_password}
            {...register("current_password")}
          />
        </Field>

        <Field
          label="New password"
          htmlFor="password"
          error={errors.password?.message}
          hint="At least 8 characters."
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            invalid={!!errors.password}
            {...register("password")}
          />
        </Field>

        <Field
          label="Confirm new password"
          htmlFor="password_confirmation"
          error={errors.password_confirmation?.message}
        >
          <PasswordInput
            id="password_confirmation"
            autoComplete="new-password"
            invalid={!!errors.password_confirmation}
            {...register("password_confirmation")}
          />
        </Field>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </Container>
  );
}
