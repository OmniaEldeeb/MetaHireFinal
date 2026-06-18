"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/profile/image-upload";
import { companyApi } from "@/lib/api/endpoints/company";
import { applyApiError } from "@/lib/api/auth-helpers";
import { useToastStore } from "@/stores/toast.store";
import type { Company } from "@/lib/api/models";

const SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

interface Values {
  name: string;
  industry: string;
  headquarters: string;
  website: string;
  description: string;
  size: string;
  founded_year: string;
}

const clean = (v: string) => (v.trim() === "" ? undefined : v.trim());

export function CompanyInfoForm({ company }: { company: Company }) {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      name: company.name ?? "",
      industry: company.industry ?? "",
      headquarters: company.headquarters ?? "",
      website: company.website ?? "",
      description: company.description ?? "",
      size: company.size ?? "",
      founded_year: company.founded_year ? String(company.founded_year) : "",
    },
  });

  async function onSubmit(v: Values) {
    setFormError(null);
    try {
      await companyApi.update({
        name: v.name,
        industry: clean(v.industry),
        headquarters: clean(v.headquarters),
        website: clean(v.website),
        description: clean(v.description),
        size_enum: clean(v.size),
        founded_year: v.founded_year ? Number(v.founded_year) : undefined,
      });
      qc.invalidateQueries({ queryKey: ["me-company"] });
      toast({ kind: "success", title: "Company saved" });
    } catch (err) {
      setFormError(applyApiError(err, setError));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <FormAlert message={formError} />

      <section className="space-y-6 rounded-2xl border border-line bg-surface p-6">
        <div>
          <p className="mb-2 text-sm font-medium">Cover photo</p>
          <ImageUpload
            shape="wide"
            currentUrl={company.cover_image_url}
            hint="Recommended 1600×400."
            fallback={<span className="text-sm text-faint">No cover yet</span>}
            onUpload={async (f) => {
              const r = await companyApi.uploadCover(f);
              return r.cover_image_url ?? r.url;
            }}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Logo</p>
          <ImageUpload
            shape="square"
            currentUrl={company.logo_url}
            hint="Square PNG works best."
            fallback={<Building2 className="h-7 w-7 text-faint" />}
            onUpload={async (f) => {
              const r = await companyApi.uploadLogo(f);
              return r.logo_url ?? r.url;
            }}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name" htmlFor="name" error={errors.name?.message}>
            <Input id="name" {...register("name", { required: "Name is required" })} />
          </Field>
          <Field label="Industry" htmlFor="industry" optional>
            <Input id="industry" placeholder="Software" {...register("industry")} />
          </Field>
          <Field label="Headquarters" htmlFor="headquarters" optional>
            <Input id="headquarters" placeholder="Cairo, Egypt" {...register("headquarters")} />
          </Field>
          <Field label="Website" htmlFor="website" optional error={errors.website?.message}>
            <Input id="website" type="url" placeholder="https://company.com" {...register("website")} />
          </Field>
          <Field label="Company size" htmlFor="size" optional>
            <select
              id="size"
              className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand"
              {...register("size")}
            >
              <option value="">Select…</option>
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s} employees
                </option>
              ))}
            </select>
          </Field>
          <Field label="Founded year" htmlFor="founded_year" optional>
            <Input id="founded_year" type="number" placeholder="2015" {...register("founded_year")} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="About" htmlFor="description" optional>
            <Textarea id="description" rows={4} placeholder="What does your company do?" {...register("description")} />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
