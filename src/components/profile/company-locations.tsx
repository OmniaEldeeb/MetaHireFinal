"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { MapPin, Plus, Trash2, Loader2, Star, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { companyApi } from "@/lib/api/endpoints/company";
import { useToastStore } from "@/stores/toast.store";
import type { CompanyLocation } from "@/lib/api/models";

interface AddValues {
  city: string;
  label: string;
  country: string;
  address: string;
}

export function CompanyLocations() {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const [remote, setRemote] = useState(false);
  const [primary, setPrimary] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["company-locations"],
    queryFn: companyApi.locations,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<AddValues>();

  const refresh = () =>
    qc.invalidateQueries({ queryKey: ["company-locations"] });

  async function onAdd(v: AddValues) {
    try {
      await companyApi.addLocation({
        city: v.city,
        label: v.label || undefined,
        country: v.country || undefined,
        address: v.address || undefined,
        is_remote_friendly: remote,
        is_primary: primary,
      });
      reset();
      setRemote(false);
      setPrimary(false);
      refresh();
      toast({ kind: "success", title: "Location added" });
    } catch {
      toast({ kind: "error", title: "Couldn't add location" });
    }
  }

  async function patch(loc: CompanyLocation, body: Partial<CompanyLocation>) {
    try {
      await companyApi.updateLocation(loc.id, body);
      refresh();
    } catch {
      toast({ kind: "error", title: "Update failed" });
    }
  }

  async function remove(id: number) {
    try {
      await companyApi.deleteLocation(id);
      refresh();
      toast({ kind: "success", title: "Location removed" });
    } catch {
      toast({ kind: "error", title: "Delete failed" });
    }
  }

  const locations = data ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-display text-lg font-bold tracking-tight">Offices</h2>
        {isLoading ? (
          <div className="grid place-items-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-faint" />
          </div>
        ) : locations.length === 0 ? (
          <p className="mt-4 text-sm text-faint">No locations added yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {locations.map((loc) => (
              <li
                key={loc.id}
                className="flex items-start gap-3 rounded-xl border border-line bg-bg-2 p-4"
              >
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      {loc.label ? `${loc.label} · ` : ""}
                      {loc.city}
                      {loc.country ? `, ${loc.country}` : ""}
                    </p>
                    {loc.is_primary ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[0.65rem] font-medium text-brand">
                        <Star className="h-3 w-3" /> Primary
                      </span>
                    ) : null}
                    {loc.is_remote_friendly ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green/12 px-2 py-0.5 text-[0.65rem] font-medium text-green">
                        <Globe className="h-3 w-3" /> Remote
                      </span>
                    ) : null}
                  </div>
                  {loc.address ? (
                    <p className="mt-0.5 text-xs text-muted">{loc.address}</p>
                  ) : null}
                  <div className="mt-2 flex gap-3 text-xs">
                    {!loc.is_primary ? (
                      <button
                        onClick={() => patch(loc, { is_primary: true })}
                        className="font-medium text-brand hover:underline"
                      >
                        Make primary
                      </button>
                    ) : null}
                    <button
                      onClick={() =>
                        patch(loc, { is_remote_friendly: !loc.is_remote_friendly })
                      }
                      className="font-medium text-muted hover:text-ink"
                    >
                      {loc.is_remote_friendly ? "Mark on-site" : "Mark remote"}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => remove(loc.id)}
                  aria-label="Delete location"
                  className="text-faint hover:text-coral"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form
        onSubmit={handleSubmit(onAdd)}
        className="rounded-2xl border border-line bg-surface p-6"
        noValidate
      >
        <h3 className="font-display text-base font-bold tracking-tight">
          Add a location
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="City" htmlFor="city" error={errors.city?.message}>
            <Input id="city" {...register("city", { required: "City is required" })} />
          </Field>
          <Field label="Label" htmlFor="label" optional>
            <Input id="label" placeholder="HQ" {...register("label")} />
          </Field>
          <Field label="Country" htmlFor="country" optional>
            <Input id="country" placeholder="Egypt" {...register("country")} />
          </Field>
          <Field label="Address" htmlFor="address" optional>
            <Input id="address" {...register("address")} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2.5 text-sm">
            <Switch checked={remote} onChange={setRemote} /> Remote friendly
          </label>
          <label className="flex items-center gap-2.5 text-sm">
            <Switch checked={primary} onChange={setPrimary} /> Set as primary
          </label>
        </div>
        <div className="mt-5">
          <Button type="submit" disabled={isSubmitting}>
            <Plus className="h-4 w-4" />
            {isSubmitting ? "Adding…" : "Add location"}
          </Button>
        </div>
      </form>
    </div>
  );
}
