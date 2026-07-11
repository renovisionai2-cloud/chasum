import { PageLoader } from "@/components/ui/loading";

export default function BookLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <PageLoader label="Loading booking page..." />
    </div>
  );
}
