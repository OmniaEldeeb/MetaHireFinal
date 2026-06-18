"use client";
import { imgUrl } from "@/lib/utils";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/stores/toast.store";

export function ImageUpload({
  shape = "circle",
  currentUrl,
  fallback,
  hint,
  onUpload,
}: {
  shape?: "circle" | "square" | "wide";
  currentUrl?: string | null;
  fallback?: React.ReactNode;
  hint?: string;
  onUpload: (file: File) => Promise<string | undefined>;
}) {
  const [url, setUrl] = useState<string | null>(currentUrl ?? null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToastStore((s) => s.push);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const next = await onUpload(file);
      setUrl(next ?? URL.createObjectURL(file));
      toast({ kind: "success", title: "Image updated" });
    } catch {
      toast({ kind: "error", title: "Upload failed", message: "Try again." });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const frame =
    shape === "wide"
      ? "h-32 w-full rounded-2xl"
      : shape === "square"
        ? "h-20 w-20 rounded-2xl"
        : "h-20 w-20 rounded-full";

  return (
    <div className={cn("flex gap-4", shape === "wide" && "flex-col")}>
      <div
        className={cn(
          "relative grid shrink-0 place-items-center overflow-hidden border border-line bg-elevated",
          frame,
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl(url) ?? ""} alt="" className="h-full w-full object-cover" />
        ) : (
          fallback
        )}
        {busy ? (
          <div className="absolute inset-0 grid place-items-center bg-black/40">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        ) : null}
      </div>
      <div className={cn(shape === "wide" && "flex items-center justify-between")}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border border-line2 bg-surface px-3.5 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand"
        >
          <Camera className="h-4 w-4" />
          Change
        </button>
        {hint ? <p className="mt-1.5 text-xs text-faint">{hint}</p> : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={pick}
      />
    </div>
  );
}
