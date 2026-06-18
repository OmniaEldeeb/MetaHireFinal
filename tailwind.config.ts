import type { Config } from "tailwindcss";

const solid = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: solid("--bg"),
        "bg-2": solid("--bg-2"),
        "bg-3": solid("--bg-3"),
        surface: solid("--surface"),
        surface2: solid("--surface-2"),
        elevated: solid("--surface-2"),
        ink: solid("--fg"),
        muted: solid("--fg-2"),
        faint: solid("--fg-3"),
        line: "var(--line)",
        line2: "var(--line-2)",
        brand: {
          DEFAULT: solid("--accent"),
          strong: solid("--accent-2"),
          soft: "var(--brand-soft)",
        },
        accent: solid("--accent"),
        green: solid("--green"),
        amber: solid("--amber"),
        coral: solid("--coral"),
        signal: solid("--amber"),
        live: solid("--green"),
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        lg: "0.625rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      maxWidth: {
        shell: "78rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(0 0 0 / 0.06), 0 12px 32px -16px rgb(0 0 0 / 0.30)",
        lift: "0 24px 80px -24px rgb(0 0 0 / 0.55)",
        glow: "0 8px 28px -6px rgb(var(--accent) / 0.45)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
