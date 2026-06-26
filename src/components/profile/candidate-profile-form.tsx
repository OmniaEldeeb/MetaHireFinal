"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SkillsInput } from "@/components/profile/skills-input";
import { ImageUpload } from "@/components/profile/image-upload";
import { profileApi } from "@/lib/api/endpoints/profile";
import { applyApiError } from "@/lib/api/auth-helpers";
import { useToastStore } from "@/stores/toast.store";
import { useAuthStore } from "@/stores/auth.store";
import type { ProfileUser } from "@/lib/api/models";

interface FormValues {
  name: string;
  phone: string;
  headline: string;
  bio: string;
  location: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  open_to_work: boolean;
  skills: string[];
  experience: {
    title: string;
    company: string;
    start_date: string;
    end_date: string;
    description: string;
  }[];
  education: { degree: string; school: string; start_date: string; end_date: string }[];
  projects: { name: string; description: string; url: string }[];
  certifications: { name: string; issuer: string; date: string }[];
}

function defaults(user: ProfileUser): FormValues {
  const p = user.candidate_profile ?? {};
  return {
    name: user.name ?? "",
    phone: user.phone ?? "",
    headline: p.headline ?? "",
    bio: p.bio ?? "",
    location: p.location ?? "",
    linkedin_url: p.linkedin_url ?? "",
    github_url: p.github_url ?? "",
    portfolio_url: p.portfolio_url ?? "",
    open_to_work: p.open_to_work ?? false,
    skills: p.skills ?? [],
    experience: (p.experience ?? []).map((e) => ({
      title: e.title ?? "",
      company: e.company ?? "",
      start_date: e.start_date ?? "",
      end_date: e.end_date ?? "",
      description: e.description ?? "",
    })),
    education: (p.education ?? []).map((e) => ({
      degree: e.degree ?? "",
      school: e.school ?? "",
      start_date: e.start_date ?? "",
      end_date: e.end_date ?? "",
    })),
    projects: (p.projects ?? []).map((e) => ({
      name: e.name ?? "",
      description: e.description ?? "",
      url: e.url ?? "",
    })),
    certifications: (p.certifications ?? []).map((e) => ({
      name: e.name ?? "",
      issuer: e.issuer ?? "",
      date: e.date ?? "",
    })),
  };
}

const clean = (v: string) => (v.trim() === "" ? undefined : v.trim());

function SectionShell({
  title,
  onAdd,
  addLabel,
  children,
}: {
  title: string;
  onAdd: () => void;
  addLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Row({
  onRemove,
  children,
}: {
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-xl border border-line bg-bg-2 p-4 pr-12">
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove"
        className="absolute right-3 top-3 text-faint hover:text-coral"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {children}
    </div>
  );
}

export function CandidateProfileForm({ user }: { user: ProfileUser }) {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const setUser = useAuthStore((s) => s.setUser);
  const role = useAuthStore((s) => s.role);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: defaults(user) });

  // Re-initialize form whenever the user prop changes (after save + refetch)
  useEffect(() => {
    reset(defaults(user));
  }, [user, reset]);

  const exp = useFieldArray({ control, name: "experience" });
  const edu = useFieldArray({ control, name: "education" });
  const prj = useFieldArray({ control, name: "projects" });
  const cert = useFieldArray({ control, name: "certifications" });

  async function onSubmit(v: FormValues) {
    setFormError(null);
    try {
      const updated = await profileApi.update({
        name: v.name,
        phone: clean(v.phone),
        headline: clean(v.headline),
        bio: clean(v.bio),
        location: clean(v.location),
        linkedin_url: clean(v.linkedin_url),
        github_url: clean(v.github_url),
        portfolio_url: clean(v.portfolio_url),
        open_to_work: v.open_to_work,
        skills: v.skills,
        experience: v.experience.filter((e) => e.title || e.company),
        education: v.education.filter((e) => e.degree || e.school),
        projects: v.projects.filter((e) => e.name),
        certifications: v.certifications.filter((e) => e.name),
      });
      if (role) setUser(updated.user, role);
      // Reset form with the fresh data from the API response
      // so all fields reflect what was actually saved
      reset(defaults(updated.user));
      qc.invalidateQueries({ queryKey: ["me-profile"] });
      toast({ kind: "success", title: "Profile saved" });
    } catch (err) {
      setFormError(applyApiError(err, setError));
    }
  }

  const inputCls = "grid gap-4 sm:grid-cols-2";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Edit profile
          </h1>
          <p className="mt-1 text-sm text-muted">
            This is what companies see when you apply.
          </p>
        </div>
        <Link
          href={`/users/${user.id}`}
          className="hidden items-center gap-1.5 text-sm font-medium text-brand hover:underline sm:inline-flex"
        >
          View public profile
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <FormAlert message={formError} />

      {/* Basics */}
      <section className="rounded-2xl border border-line bg-surface p-6">
        <ImageUpload
          shape="circle"
          currentUrl={user.candidate_profile?.profile_image_url}
          hint="JPEG, PNG or WebP."
          fallback={
            <span className="font-display text-2xl font-bold text-brand">
              {user.name?.charAt(0) ?? "U"}
            </span>
          }
          onUpload={async (file) => {
            const res = await profileApi.uploadAvatar(file);
            return res.profile_image_url ?? res.url;
          }}
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name" error={errors.name?.message}>
            <Input id="name" {...register("name", { required: "Name is required" })} />
          </Field>
          <Field label="Phone" htmlFor="phone" optional>
            <Input id="phone" type="tel" placeholder="+201001234567" {...register("phone")} />
          </Field>
          <Field label="Headline" htmlFor="headline" optional>
            <Input id="headline" placeholder="Full-stack developer" {...register("headline")} />
          </Field>
          <Field label="Location" htmlFor="location" optional>
            <Input id="location" placeholder="Cairo, Egypt" {...register("location")} />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Bio" htmlFor="bio" optional>
            <Textarea id="bio" rows={4} placeholder="A short summary about you…" {...register("bio")} />
          </Field>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-bg-2 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Open to work</p>
            <p className="text-xs text-muted">Show recruiters you&apos;re available.</p>
          </div>
          <Controller
            control={control}
            name="open_to_work"
            render={({ field }) => (
              <Switch checked={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </section>

      {/* Links */}
      <section className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-display text-lg font-bold tracking-tight">Links</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Field label="LinkedIn" htmlFor="linkedin_url" optional error={errors.linkedin_url?.message}>
            <Input id="linkedin_url" type="url" placeholder="https://linkedin.com/in/…" {...register("linkedin_url")} />
          </Field>
          <Field label="GitHub" htmlFor="github_url" optional error={errors.github_url?.message}>
            <Input id="github_url" type="url" placeholder="https://github.com/…" {...register("github_url")} />
          </Field>
          <Field label="Portfolio" htmlFor="portfolio_url" optional error={errors.portfolio_url?.message}>
            <Input id="portfolio_url" type="url" placeholder="https://…" {...register("portfolio_url")} />
          </Field>
        </div>
      </section>

      {/* Skills */}
      <section className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-display text-lg font-bold tracking-tight">Skills</h2>
        <p className="mb-3 mt-1 text-xs text-muted">Press Enter or comma to add.</p>
        <Controller
          control={control}
          name="skills"
          render={({ field }) => (
            <SkillsInput value={field.value} onChange={field.onChange} />
          )}
        />
      </section>

      {/* Experience */}
      <SectionShell
        title="Experience"
        addLabel="Add role"
        onAdd={() =>
          exp.append({ title: "", company: "", start_date: "", end_date: "", description: "" })
        }
      >
        {exp.fields.map((f, i) => (
          <Row key={f.id} onRemove={() => exp.remove(i)}>
            <div className={inputCls}>
              <Field label="Title" htmlFor={`exp-title-${i}`}>
                <Input id={`exp-title-${i}`} {...register(`experience.${i}.title`)} />
              </Field>
              <Field label="Company" htmlFor={`exp-company-${i}`}>
                <Input id={`exp-company-${i}`} {...register(`experience.${i}.company`)} />
              </Field>
              <Field label="Start date" htmlFor={`exp-start-${i}`}>
                <Input id={`exp-start-${i}`} type="date" {...register(`experience.${i}.start_date`)} />
              </Field>
              <Field label="End date" htmlFor={`exp-end-${i}`} optional>
                <Input id={`exp-end-${i}`} type="date" {...register(`experience.${i}.end_date`)} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Description" htmlFor={`exp-desc-${i}`} optional>
                <Textarea id={`exp-desc-${i}`} rows={3} {...register(`experience.${i}.description`)} />
              </Field>
            </div>
          </Row>
        ))}
        {exp.fields.length === 0 ? (
          <p className="text-sm text-faint">No experience added yet.</p>
        ) : null}
      </SectionShell>

      {/* Education */}
      <SectionShell
        title="Education"
        addLabel="Add education"
        onAdd={() => edu.append({ degree: "", school: "", start_date: "", end_date: "" })}
      >
        {edu.fields.map((f, i) => (
          <Row key={f.id} onRemove={() => edu.remove(i)}>
            <div className={inputCls}>
              <Field label="Degree" htmlFor={`edu-degree-${i}`}>
                <Input id={`edu-degree-${i}`} {...register(`education.${i}.degree`)} />
              </Field>
              <Field label="School" htmlFor={`edu-school-${i}`}>
                <Input id={`edu-school-${i}`} {...register(`education.${i}.school`)} />
              </Field>
              <Field label="Start date" htmlFor={`edu-start-${i}`}>
                <Input id={`edu-start-${i}`} type="date" {...register(`education.${i}.start_date`)} />
              </Field>
              <Field label="End date" htmlFor={`edu-end-${i}`} optional>
                <Input id={`edu-end-${i}`} type="date" {...register(`education.${i}.end_date`)} />
              </Field>
            </div>
          </Row>
        ))}
        {edu.fields.length === 0 ? (
          <p className="text-sm text-faint">No education added yet.</p>
        ) : null}
      </SectionShell>

      {/* Projects */}
      <SectionShell
        title="Projects"
        addLabel="Add project"
        onAdd={() => prj.append({ name: "", description: "", url: "" })}
      >
        {prj.fields.map((f, i) => (
          <Row key={f.id} onRemove={() => prj.remove(i)}>
            <div className={inputCls}>
              <Field label="Name" htmlFor={`prj-name-${i}`}>
                <Input id={`prj-name-${i}`} {...register(`projects.${i}.name`)} />
              </Field>
              <Field label="URL" htmlFor={`prj-url-${i}`} optional>
                <Input id={`prj-url-${i}`} type="url" {...register(`projects.${i}.url`)} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Description" htmlFor={`prj-desc-${i}`} optional>
                <Textarea id={`prj-desc-${i}`} rows={2} {...register(`projects.${i}.description`)} />
              </Field>
            </div>
          </Row>
        ))}
        {prj.fields.length === 0 ? (
          <p className="text-sm text-faint">No projects added yet.</p>
        ) : null}
      </SectionShell>

      {/* Certifications */}
      <SectionShell
        title="Certifications"
        addLabel="Add certification"
        onAdd={() => cert.append({ name: "", issuer: "", date: "" })}
      >
        {cert.fields.map((f, i) => (
          <Row key={f.id} onRemove={() => cert.remove(i)}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Name" htmlFor={`cert-name-${i}`}>
                <Input id={`cert-name-${i}`} {...register(`certifications.${i}.name`)} />
              </Field>
              <Field label="Issuer" htmlFor={`cert-issuer-${i}`} optional>
                <Input id={`cert-issuer-${i}`} {...register(`certifications.${i}.issuer`)} />
              </Field>
              <Field label="Date" htmlFor={`cert-date-${i}`} optional>
                <Input id={`cert-date-${i}`} type="date" {...register(`certifications.${i}.date`)} />
              </Field>
            </div>
          </Row>
        ))}
        {cert.fields.length === 0 ? (
          <p className="text-sm text-faint">No certifications added yet.</p>
        ) : null}
      </SectionShell>

      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting} className="shadow-lift">
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}