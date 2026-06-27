"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Loader2, Mic, ScanFace, AudioWaveform } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { SkillsInput } from "@/components/profile/skills-input";
import { LANGUAGE } from "@/lib/constants/enums";
import { EXPERIENCE_LEVEL_LABELS } from "@/lib/constants/labels";
import type { StartSessionBody } from "@/lib/api/endpoints/interview";

// The AI interview backend accepts only these four levels.
const INTERVIEW_LEVELS = ["junior", "mid", "senior", "lead"] as const;

interface SetupValues {
  target_role: string;
  level: string;
  experience_years: string;
  language: string;
  total_questions: string;
  target_company: string;
  job_description_text: string;
  tech_stack: string[];
}

const selectCls = "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand";

const SIGNALS = [
  { icon: Mic, label: "Answer scoring", desc: "Each response is evaluated against ideal answers." },
  { icon: AudioWaveform, label: "Voice tone", desc: "Emotion and confidence read from audio." },
  { icon: ScanFace, label: "Expression", desc: "Engagement tracked via webcam frames." },
];

export function InterviewSetup({
  onStart,
}: {
  onStart: (body: StartSessionBody) => void;
}) {
  const [busy, setBusy] = useState(false);
  const { register, control, handleSubmit, formState: { errors } } = useForm<SetupValues>({
    defaultValues: {
      target_role: "",
      level: "mid",
      experience_years: "3",
      language: "en",
      total_questions: "10",
      target_company: "",
      job_description_text: "",
      tech_stack: [],
    },
  });

  const onSubmit = (v: SetupValues) => {
    setBusy(true);
    onStart({
      target_role: v.target_role,
      level: v.level,
      tech_stack: v.tech_stack,
      experience_years: Number(v.experience_years),
      language: v.language as "en" | "ar",
      total_questions: Number(v.total_questions) as 5 | 10 | 15,
      target_company: v.target_company || undefined,
      job_description_text: v.job_description_text || undefined,
    });
  };

  return (
    <div className="mx-auto max-w-2xl py-8 px-5">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Practice interview
        </h1>
        <p className="mt-2 text-muted">
          Set up your session. Three signals run in parallel during the interview.
        </p>
      </div>

      {/* Signal cards */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {SIGNALS.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="rounded-2xl border border-line bg-surface p-4 text-center">
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-2 text-xs font-semibold">{label}</p>
            <p className="mt-0.5 text-[0.65rem] text-faint">{desc}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Target role" htmlFor="target_role" error={errors.target_role?.message}>
            <Input id="target_role" placeholder="Backend Developer" invalid={!!errors.target_role}
              {...register("target_role", { required: "Role is required" })} />
          </Field>
          <Field label="Experience level" htmlFor="level">
            <select id="level" className={selectCls} {...register("level")}>
              {INTERVIEW_LEVELS.map((l) => (
                <option key={l} value={l}>{EXPERIENCE_LEVEL_LABELS[l]}</option>
              ))}
            </select>
          </Field>
          <Field label="Years of experience" htmlFor="exp">
            <Input id="exp" type="number" min={0} max={50} {...register("experience_years")} />
          </Field>
          <Field label="Language" htmlFor="lang">
            <select id="lang" className={selectCls} {...register("language")}>
              {LANGUAGE.map((l) => (
                <option key={l} value={l}>{l === "en" ? "English" : "العربية"}</option>
              ))}
            </select>
          </Field>
          <Field label="Number of questions" htmlFor="total_questions">
            <select id="total_questions" className={selectCls} {...register("total_questions")}>
              <option value="5">5 questions (~15 min)</option>
              <option value="10">10 questions (~30 min)</option>
              <option value="15">15 questions (~45 min)</option>
            </select>
          </Field>
          <Field label="Target company" htmlFor="tc" optional>
            <Input id="tc" placeholder="Google" {...register("target_company")} />
          </Field>
        </div>

        <Field label="Tech stack" htmlFor="tech_stack" error={errors.tech_stack?.message}>
          <Controller control={control} name="tech_stack" rules={{ validate: (v) => v.length > 0 || "Add at least one technology" }}
            render={({ field }) => <SkillsInput value={field.value} onChange={field.onChange} />} />
          {errors.tech_stack && <p className="mt-1 text-xs text-coral">{errors.tech_stack.message as string}</p>}
        </Field>

        <Field label="Paste job description" htmlFor="jd" optional hint="Tailors questions to the actual role.">
          <textarea id="jd" rows={3} placeholder="We are looking for…"
            className="w-full resize-y rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-brand"
            {...register("job_description_text")} />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Starting…</> : "Start interview"}
        </Button>
      </form>
    </div>
  );
}