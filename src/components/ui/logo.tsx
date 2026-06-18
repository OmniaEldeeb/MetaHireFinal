import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-baseline font-display font-extrabold tracking-tight",
        className,
      )}
      aria-label="MetaHire home"
    >
      <span className="text-gradient glow-accent text-[1.75rem] leading-none">
        M
      </span>
      <span className="text-[1.375rem] text-ink">etaHire</span>
    </Link>
  );
}
