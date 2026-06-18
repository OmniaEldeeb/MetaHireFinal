import { JobsGridSkeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/ui/section";
export default function PublicLoading() {
  return <Container className="py-16"><JobsGridSkeleton count={6} /></Container>;
}
