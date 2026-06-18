"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input, PasswordInput } from "@/components/ui/input";
import { GoogleSignInButton } from "@/components/auth/google-button";
import { authApi } from "@/lib/api/endpoints/auth";
import { applyApiError, deviceName } from "@/lib/api/auth-helpers";
import { useAuthSuccess } from "@/lib/hooks/use-auth";
import { candidateSchema, type CandidateValues } from "@/lib/validation/auth";

export default function RegisterPage() {
  const onSuccess = useAuthSuccess();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CandidateValues>({ resolver: zodResolver(candidateSchema) });

  async function onSubmit(values: CandidateValues) {
    setFormError(null);
    try {
      const payload = await authApi.registerCandidate({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
        password_confirmation: values.password_confirmation,
        device_name: deviceName(),
      });
      onSuccess(payload);
    } catch (err) {
      setFormError(applyApiError(err, setError));
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Create your profile
      </h1>
      <p className="mt-2 text-sm text-muted">
        Free for candidates — get hired on evidence.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <FormAlert message={formError} />

        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Ahmed Hassan"
            invalid={!!errors.name}
            {...register("name")}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            invalid={!!errors.email}
            {...register("email")}
          />
        </Field>

        <Field
          label="Phone"
          htmlFor="phone"
          optional
          error={errors.phone?.message}
        >
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+201001234567"
            invalid={!!errors.phone}
            {...register("phone")}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          hint="At least 8 characters."
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="••••••••"
            invalid={!!errors.password}
            {...register("password")}
          />
        </Field>

        <Field
          label="Confirm password"
          htmlFor="password_confirmation"
          error={errors.password_confirmation?.message}
        >
          <PasswordInput
            id="password_confirmation"
            autoComplete="new-password"
            placeholder="••••••••"
            invalid={!!errors.password_confirmation}
            {...register("password_confirmation")}
          />
        </Field>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
      <GoogleSignInButton />

      <p className="mt-8 text-center text-sm text-muted">
        Hiring instead?{" "}
        <Link
          href="/register/company"
          className="font-medium text-brand hover:underline"
        >
          Create a company account
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
