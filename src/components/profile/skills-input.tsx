"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function SkillsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-soft px-2.5 py-1 text-sm text-brand"
          >
            {s}
            <button
              type="button"
              aria-label={`Remove ${s}`}
              onClick={() => onChange(value.filter((x) => x !== s))}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={add}
          placeholder="Add a skill…"
          className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-muted/70"
        />
      </div>
    </div>
  );
}
