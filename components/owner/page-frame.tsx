import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { AlertTriangle } from "lucide-react";

export function OwnerPageFrame({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="ds-page">
      <PageHeader title={title} description={description}>
        {actions}
      </PageHeader>
      {children}
    </div>
  );
}

export function OwnerErrorState({
  title = "Could not load Owner Platform data",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <EmptyState
      glyph={AlertTriangle}
      title={title}
      description={message}
    />
  );
}
