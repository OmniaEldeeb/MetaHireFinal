"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full resize-y rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/70",
        invalid ? "border-coral/70 focus:border-coral" : "border-line focus:border-brand",
        className,
      )}
      {...props}
    />
  );
});
