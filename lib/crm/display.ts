export function displayCustomerName(customer: {
  name?: string | null;
  preferred_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}): string {
  if (customer.preferred_name?.trim()) return customer.preferred_name.trim();
  const composed = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (composed) return composed;
  return customer.name?.trim() || "Customer";
}
