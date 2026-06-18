import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "signal" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap rounded-xl transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:translate-y-px";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-strong hover:-translate-y-0.5 hover:shadow-glow",
  signal: "bg-amber text-[#0A0B0F] hover:brightness-105 hover:-translate-y-0.5",
  outline:
    "border border-line2 bg-transparent text-ink hover:border-brand hover:text-brand",
  ghost:
    "border border-line2 bg-transparent text-muted hover:text-ink hover:bg-surface",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-[3.25rem] px-7 text-base",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

type ButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AnchorProps = BaseProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps | AnchorProps
>(function Button({ variant = "primary", size = "md", className, ...props }, ref) {
  const classes = cn(base, variants[variant], sizes[size], className);
  if ("href" in props && props.href !== undefined) {
    const { href, ...rest } = props as AnchorProps;
    return (
      <Link
        href={href}
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={classes}
        {...rest}
      />
    );
  }
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      className={classes}
      {...(props as ButtonProps)}
    />
  );
});
