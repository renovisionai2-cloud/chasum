export default function EmployeesLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading employees">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-96 max-w-full animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-[var(--radius-lg)] border border-border bg-muted/40"
          />
        ))}
      </div>
    </div>
  );
}
