"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ChevronRight, LogOut, Loader2, Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Container } from "@/components/ui/section";
import { useAuthStore } from "@/stores/auth.store";
import { useToastStore } from "@/stores/toast.store";
import { authApi } from "@/lib/api/endpoints/auth";

function ThemeRow() {
  const { theme, setTheme } = useTheme();
  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
        <Moon className="h-5 w-5" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium">Appearance</span>
        <span className="block text-xs text-muted">Choose your preferred theme.</span>
      </span>
      <div className="flex gap-1">
        {themes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            title={label}
            className={`grid h-9 w-9 place-items-center rounded-xl border text-sm transition-colors ${
              theme === value
                ? "border-brand bg-brand/10 text-brand"
                : "border-line text-faint hover:border-brand/40 hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

function LogoutAllRow() {
  const [loading, setLoading] = useState(false);
  const signOut = useAuthStore((s) => s.signOut);
  const toast = useToastStore((s) => s.push);
  const router = useRouter();

  const handleLogoutAll = async () => {
    if (!confirm("This will sign you out of all devices. Continue?")) return;
    setLoading(true);
    try {
      await authApi.logoutAll();
      signOut();
      router.replace("/login");
    } catch {
      toast({ kind: "error", title: "Couldn't sign out all devices" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogoutAll}
      disabled={loading}
      className="flex w-full items-center gap-4 px-5 py-4 hover:bg-elevated disabled:opacity-60"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-coral/12 text-coral">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
      </span>
      <span className="flex-1 text-left">
        <span className="block text-sm font-medium">Sign out all devices</span>
        <span className="block text-xs text-muted">Revoke all active sessions everywhere.</span>
      </span>
    </button>
  );
}

export default function SettingsPage() {
  return (
    <Container className="max-w-2xl py-10">
      <h1 className="mb-6 font-display text-2xl font-extrabold tracking-tight">Settings</h1>
      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        <ThemeRow />
        <Link
          href="/settings/password"
          className="flex items-center gap-4 px-5 py-4 hover:bg-elevated"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
            <KeyRound className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium">Password</span>
            <span className="block text-xs text-muted">Change your password and sign out other devices.</span>
          </span>
          <ChevronRight className="h-4 w-4 text-faint" />
        </Link>
        <LogoutAllRow />
      </div>
    </Container>
  );
}
