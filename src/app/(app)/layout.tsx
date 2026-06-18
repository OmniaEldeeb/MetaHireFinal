import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/app/app-shell";
import { RealtimeProvider } from "@/components/providers/realtime-provider";
import { Toaster } from "@/components/ui/toaster";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RealtimeProvider>
        <AppShell>{children}</AppShell>
        <Toaster />
      </RealtimeProvider>
    </AuthGuard>
  );
}
