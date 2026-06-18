import { PROOF_LOGOS } from "@/lib/content/landing";

export function SocialProof() {
  return (
    <div className="border-y border-line bg-bg-2 px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-shell">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-faint">
          Trusted by teams hiring smarter
        </p>
        <ul className="mt-7 flex flex-wrap items-center justify-center gap-4">
          {PROOF_LOGOS.map((name) => (
            <li
              key={name}
              className="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold tracking-wide text-faint"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
