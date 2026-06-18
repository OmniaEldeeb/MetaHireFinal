"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input, PasswordInput } from "@/components/ui/input";
import { authApi } from "@/lib/api/endpoints/auth";
import { applyApiError } from "@/lib/api/auth-helpers";
import {
  identifierSchema,
  newPasswordSchema,
  otpSchema,
  type IdentifierValues,
  type NewPasswordValues,
  type OtpValues,
} from "@/lib/validation/auth";

type Step = "request" | "verify" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [identifier, setIdentifier] = useState("");
  // reset_token stays in memory only — never persisted.
  const [resetToken, setResetToken] = useState("");
  const [smsNotice, setSmsNotice] = useState(false);

  return (
    <div>
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>

      {step === "request" && (
        <RequestStep
          smsNotice={smsNotice}
          onSms={() => setSmsNotice(true)}
          onSent={(id) => {
            setIdentifier(id);
            setSmsNotice(false);
            setStep("verify");
          }}
        />
      )}

      {step === "verify" && (
        <VerifyStep
          identifier={identifier}
          onVerified={(token) => {
            setResetToken(token);
            setStep("reset");
          }}
          onBack={() => setStep("request")}
        />
      )}

      {step === "reset" && (
        <ResetStep
          identifier={identifier}
          resetToken={resetToken}
          onDone={() => setStep("done")}
        />
      )}

      {step === "done" && (
        <div className="mt-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-live" />
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
            Password updated
          </h1>
          <p className="mt-2 text-sm text-muted">
            You can now log in with your new password.
          </p>
          <Button className="mt-6 w-full" onClick={() => router.replace("/login")}>
            Go to login
          </Button>
        </div>
      )}
    </div>
  );
}

function RequestStep({
  onSent,
  onSms,
  smsNotice,
}: {
  onSent: (identifier: string) => void;
  onSms: () => void;
  smsNotice: boolean;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<IdentifierValues>({ resolver: zodResolver(identifierSchema) });

  async function onSubmit(values: IdentifierValues) {
    setFormError(null);
    try {
      const res = await authApi.forgotPassword(values);
      if (res.use_firebase || res.channel === "sms") {
        onSms();
        return;
      }
      onSent(getValues("identifier"));
    } catch (err) {
      setFormError(applyApiError(err, setError));
    }
  }

  return (
    <>
      <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">
        Reset your password
      </h1>
      <p className="mt-2 text-sm text-muted">
        Enter your email and we&apos;ll send a code to reset it.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <FormAlert message={formError} />
        {smsNotice ? (
          <p className="rounded-xl border border-line bg-elevated px-3.5 py-3 text-sm text-muted">
            This account resets by SMS. Please use the MetaHire mobile app to
            verify your phone number.
          </p>
        ) : null}
        <Field
          label="Email or phone"
          htmlFor="identifier"
          error={errors.identifier?.message}
        >
          <Input
            id="identifier"
            placeholder="you@example.com"
            invalid={!!errors.identifier}
            {...register("identifier")}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset code"}
        </Button>
      </form>
    </>
  );
}

function VerifyStep({
  identifier,
  onVerified,
  onBack,
}: {
  identifier: string;
  onVerified: (token: string) => void;
  onBack: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OtpValues>({ resolver: zodResolver(otpSchema) });

  async function onSubmit(values: OtpValues) {
    setFormError(null);
    try {
      const res = await authApi.verifyOtp({ identifier, otp: values.otp });
      onVerified(res.reset_token);
    } catch (err) {
      setFormError(applyApiError(err, setError));
    }
  }

  return (
    <>
      <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">
        Enter the code
      </h1>
      <p className="mt-2 text-sm text-muted">
        We sent a code to{" "}
        <span className="font-medium text-ink">{identifier}</span>.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <FormAlert message={formError} />
        <Field label="Verification code" htmlFor="otp" error={errors.otp?.message}>
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="025823"
            className="readout tracking-[0.4em]"
            invalid={!!errors.otp}
            {...register("otp")}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Verifying…" : "Verify code"}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="w-full text-center text-sm text-muted hover:text-ink"
        >
          Use a different email
        </button>
      </form>
    </>
  );
}

function ResetStep({
  identifier,
  resetToken,
  onDone,
}: {
  identifier: string;
  resetToken: string;
  onDone: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordValues>({ resolver: zodResolver(newPasswordSchema) });

  async function onSubmit(values: NewPasswordValues) {
    setFormError(null);
    try {
      await authApi.resetPassword({
        identifier,
        reset_token: resetToken,
        password: values.password,
        password_confirmation: values.password_confirmation,
      });
      onDone();
    } catch (err) {
      setFormError(applyApiError(err, setError));
    }
  }

  return (
    <>
      <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">
        Set a new password
      </h1>
      <p className="mt-2 text-sm text-muted">Choose something memorable.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <FormAlert message={formError} />
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
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </>
  );
}
