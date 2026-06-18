"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input, PasswordInput } from "@/components/ui/input";
import { authApi } from "@/lib/api/endpoints/auth";
import { applyApiError, deviceName } from "@/lib/api/auth-helpers";
import { useAuthSuccess } from "@/lib/hooks/use-auth";
import { companySchema, type CompanyValues } from "@/lib/validation/auth";

export default function CompanyRegisterPage() {
  const onSuccess = useAuthSuccess();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CompanyValues>({ resolver: zodResolver(companySchema) });

  async function onSubmit(values: CompanyValues) {
    setFormError(null);
    try {
      const payload = await authApi.registerCompany({
        name: values.name,
        email: values.email,
        company_name: values.company_name,
        industry: values.industry || undefined,
        headquarters: values.headquarters || undefined,
        website: values.website || undefined,
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
        Hire with MetaHire
      </h1>
      <p className="mt-2 text-sm text-muted">
        Set up your company and post your first role.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <FormAlert message={formError} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" htmlFor="name" error={errors.name?.message}>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Sara Ahmed"
              invalid={!!errors.name}
              {...register("name")}
            />
          </Field>
          <Field
            label="Work email"
            htmlFor="email"
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              invalid={!!errors.email}
              {...register("email")}
            />
          </Field>
        </div>

        <Field
          label="Company name"
          htmlFor="company_name"
          error={errors.company_name?.message}
        >
          <Input
            id="company_name"
            placeholder="TechCorp Egypt"
            invalid={!!errors.company_name}
            {...register("company_name")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Industry"
            htmlFor="industry"
            optional
            error={errors.industry?.message}
          >
            <Input
              id="industry"
              placeholder="Software"
              invalid={!!errors.industry}
              {...register("industry")}
            />
          </Field>
          <Field
            label="Headquarters"
            htmlFor="headquarters"
            optional
            error={errors.headquarters?.message}
          >
            <Input
              id="headquarters"
              placeholder="Cairo, Egypt"
              invalid={!!errors.headquarters}
              {...register("headquarters")}
            />
          </Field>
        </div>

        <Field
          label="Website"
          htmlFor="website"
          optional
          error={errors.website?.message}
        >
          <Input
            id="website"
            type="url"
            placeholder="https://company.com"
            invalid={!!errors.website}
            {...register("website")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Password"
            htmlFor="password"
            error={errors.password?.message}
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
            label="Confirm"
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
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create company account"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Looking for a job?{" "}
        <Link href="/register" className="font-medium text-brand hover:underline">
          Create a candidate account
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
