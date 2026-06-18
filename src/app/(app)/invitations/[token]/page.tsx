import { InvitationView } from "@/components/profile/invitation-view";

export default function InvitationPage({
  params,
}: {
  params: { token: string };
}) {
  return <InvitationView token={params.token} />;
}
