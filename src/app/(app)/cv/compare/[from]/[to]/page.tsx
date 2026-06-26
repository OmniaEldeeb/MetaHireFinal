import { CvComparePage } from "@/components/cv/cv-compare-page";

export default function Page({
  params,
}: {
  params: { from: string; to: string };
}) {
  return (
    <CvComparePage fromId={Number(params.from)} toId={Number(params.to)} />
  );
}