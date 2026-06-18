import { Container } from "@/components/ui/section";
import { NotificationsList } from "@/components/app/notifications-list";

export default function NotificationsPage() {
  return (
    <Container className="max-w-2xl py-10">
      <h1 className="mb-6 font-display text-2xl font-extrabold tracking-tight">
        Notifications
      </h1>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <NotificationsList />
      </div>
    </Container>
  );
}
