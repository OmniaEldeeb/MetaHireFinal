import { PublicCandidate } from "@/components/profile/public-candidate";

export default function UserProfilePage({
  params,
}: {
  params: { id: string };
}) {
  return <PublicCandidate id={Number(params.id)} />;
}
