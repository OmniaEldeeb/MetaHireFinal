"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SkillsInput } from "@/components/profile/skills-input";
import { applyApiError } from "@/lib/api/auth-helpers";
import { companyJobsApi, type CreateJobBody } from "@/lib/api/endpoints/company-jobs";
import { useToastStore } from "@/stores/toast.store";
import {
  WORK_TYPE, WORK_MODEL, EXPERIENCE_LEVEL,
} from "@/lib/constants/enums";
import {
  WORK_TYPE_LABELS, WORK_MODEL_LABELS, EXPERIENCE_LEVEL_LABELS,
} from "@/lib/constants/labels";
import type { Job } from "@/lib/api/endpoints/jobs";

interface FormValues {
  title: string;
  target_role: string;
  description: string;
  requirements: string;
  work_type: string;
  work_model: string;
  experience_level: string;
  location: string;
  salary_range: string;
  expires_at: string;
  announce_in_feed: boolean;
  auto_invite_enabled: boolean;
  auto_ai_invite_count: string;
  auto_final_invite_count: string;
  min_cv_score: string;
  min_ai_score: string;
  focus_criteria: string;
  skills: string[];
}

function defaults(job?: Job): FormValues {
  return {
    title: job?.title ?? "",
    target_role: job?.target_role ?? "",
    description: job?.description ?? "",
    requirements: (job?.requirements ?? []).join("\n"),
    work_type: job?.work_type ?? "full_time",
    work_model: job?.work_model ?? "onsite",
    experience_level: job?.experience_level ?? "mid",
    location: job?.location ?? "",
    salary_range: job?.salary_range ?? "",
    expires_at: job?.expires_at?.split("T")[0] ?? "",
    announce_in_feed: false,
    auto_invite_enabled: false,
    auto_ai_invite_count: "5",
    auto_final_invite_count: "3",
    min_cv_score: "70",
    min_ai_score: "60",
    focus_criteria: "",
    skills: job?.skills ?? [],
  };
}

const selectCls =
  "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand";

export function JobForm({ job }: { job?: Job }) {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = !!job;

  const { register, control, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: defaults(job),
  });

  const autoEnabled = watch("auto_invite_enabled");

  async function onSubmit(v: FormValues) {
    setFormError(null);
    const body: CreateJobBody = {
      title: v.title,
      description: v.description,
      work_type: v.work_type as CreateJobBody["work_type"],
      work_model: v.work_model as CreateJobBody["work_model"],
      experience_level: v.experience_level as CreateJobBody["experience_level"],
      target_role: v.target_role || undefined,
      requirements: v.requirements.split("\n").map(s => s.trim()).filter(Boolean),
      skills: v.skills,
      location: v.location || undefined,
      salary_range: v.salary_range || undefined,
      expires_at: v.expires_at || undefined,
      announce_in_feed: v.announce_in_feed,
      auto_invite_enabled: v.auto_invite_enabled,
      auto_ai_invite_count: Number(v.auto_ai_invite_count),
      auto_final_invite_count: Number(v.auto_final_invite_count),
      min_cv_score: Number(v.min_cv_score),
      min_ai_score: Number(v.min_ai_score),
      focus_criteria: v.focus_criteria.split(",").map(s => s.trim()).filter(Boolean),
    };
    try {
      if (isEdit) {
        await companyJobsApi.updateJob(job.id, body);
        qc.invalidateQueries({ queryKey: ["company-jobs"] });
        qc.invalidateQueries({ queryKey: ["company-job", job.id] });
        toast({ kind: "success", title: "Job updated" });
        router.push(`/company/jobs/${job.id}`);
      } else {
        const newJob = await companyJobsApi.createJob(body);
        qc.invalidateQueries({ queryKey: ["company-jobs"] });
        toast({ kind: "success", title: "Job posted!" });
        router.push(`/company/jobs/${(newJob as Job).id ?? ""}`);
      }
    } catch (err) {
      setFormError(applyApiError(err, setError));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            {isEdit ? "Edit job" : "Post a new job"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isEdit ? "Update the role details." : "Fill in the details or use the AI chatbot."}
          </p>
        </div>
        {!isEdit && (
          <Button href="/company/jobs/chatbot" variant="outline" size="sm">
            <Wand2 className="h-4 w-4" />
            Use AI chatbot
          </Button>
        )}
      </div>

      <FormAlert message={formError} />

      {/* Core */}
      <section className="space-y-4 rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-display text-lg font-bold tracking-tight">Role details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job title" htmlFor="title" error={errors.title?.message}>
            <Input id="title" {...register("title", { required: "Title is required" })} invalid={!!errors.title} />
          </Field>
          <Field label="Target role" htmlFor="target_role" optional>
            <Input id="target_role" placeholder="e.g. Backend Engineer" {...register("target_role")} />
          </Field>
        </div>
        <Field label="Description" htmlFor="description" error={errors.description?.message}>
          <Textarea id="description" rows={6} {...register("description", { required: "Description is required" })} invalid={!!errors.description} />
        </Field>
        <Field label="Requirements" htmlFor="requirements" optional hint="One per line.">
          <Textarea id="requirements" rows={4} placeholder="5+ years experience&#10;Strong communication skills" {...register("requirements")} />
        </Field>
        <div>
          <p className="mb-2 text-sm font-medium">Skills</p>
          <Controller control={control} name="skills" render={({ field }) => (
            <SkillsInput value={field.value} onChange={field.onChange} />
          )} />
        </div>
      </section>

      {/* Classification */}
      <section className="space-y-4 rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-display text-lg font-bold tracking-tight">Classification</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Work type" htmlFor="work_type">
            <select id="work_type" className={selectCls} {...register("work_type")}>
              {WORK_TYPE.map(t => <option key={t} value={t}>{WORK_TYPE_LABELS[t]}</option>)}
            </select>
          </Field>
          <Field label="Work model" htmlFor="work_model">
            <select id="work_model" className={selectCls} {...register("work_model")}>
              {WORK_MODEL.map(t => <option key={t} value={t}>{WORK_MODEL_LABELS[t]}</option>)}
            </select>
          </Field>
          <Field label="Experience level" htmlFor="experience_level">
            <select id="experience_level" className={selectCls} {...register("experience_level")}>
              {EXPERIENCE_LEVEL.map(t => <option key={t} value={t}>{EXPERIENCE_LEVEL_LABELS[t]}</option>)}
            </select>
          </Field>
          <Field label="Location" htmlFor="location" optional>
            <Input id="location" placeholder="Cairo, Egypt" {...register("location")} />
          </Field>
          <Field label="Salary range" htmlFor="salary_range" optional>
            <Input id="salary_range" placeholder="25 000 – 35 000 EGP" {...register("salary_range")} />
          </Field>
          <Field label="Expires on" htmlFor="expires_at" optional>
            <Input id="expires_at" type="date" {...register("expires_at")} />
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-line bg-bg-2 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Announce in feed</p>
            <p className="text-xs text-muted">Share this role as a post in the social feed.</p>
          </div>
          <Controller control={control} name="announce_in_feed" render={({ field }) => (
            <Switch checked={field.value} onChange={field.onChange} />
          )} />
        </div>
      </section>

      {/* Auto-invite */}
      <section className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight">Auto-invite</h2>
            <p className="mt-1 text-sm text-muted">Automatically advance top-scoring candidates.</p>
          </div>
          <Controller control={control} name="auto_invite_enabled" render={({ field }) => (
            <Switch checked={field.value} onChange={field.onChange} />
          )} />
        </div>
        {autoEnabled && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="AI interview invites" htmlFor="auto_ai_invite_count" hint="Top N candidates by CV score.">
              <Input id="auto_ai_invite_count" type="number" min={1} max={50} {...register("auto_ai_invite_count")} />
            </Field>
            <Field label="Final round invites" htmlFor="auto_final_invite_count" hint="Top N by AI interview score.">
              <Input id="auto_final_invite_count" type="number" min={1} max={20} {...register("auto_final_invite_count")} />
            </Field>
            <Field label="Min CV score" htmlFor="min_cv_score" hint="0–100">
              <Input id="min_cv_score" type="number" min={0} max={100} {...register("min_cv_score")} />
            </Field>
            <Field label="Min AI interview score" htmlFor="min_ai_score" hint="0–100">
              <Input id="min_ai_score" type="number" min={0} max={100} {...register("min_ai_score")} />
            </Field>
            <Field label="Focus criteria" htmlFor="focus_criteria" optional hint="Comma-separated: Communication, Problem solving">
              <Input id="focus_criteria" {...register("focus_criteria")} />
            </Field>
          </div>
        )}
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : isEdit ? "Save changes" : "Post job"}
        </Button>
      </div>
    </form>
  );
}
