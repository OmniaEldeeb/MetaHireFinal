import { PublicCompany } from "@/components/profile/public-company";

export default function CompanyProfilePage({
  params,
}: {
  params: { id: string };
}) {
  return <PublicCompany id={Number(params.id)} />;
}
