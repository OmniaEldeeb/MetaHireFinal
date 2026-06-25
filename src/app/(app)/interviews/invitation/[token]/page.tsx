import { InterviewInvitationPage } from "@/components/interview/interview-invitation-page";

export default function Page({ params }: { params: { token: string } }) {
  return <InterviewInvitationPage token={params.token} />;
}