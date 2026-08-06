/**
 * Global New / quick-create actions — genuine workflows only.
 */

export const QUICK_CREATE_ACTIONS = [
  {
    href: "/dashboard/calendar?view=day&book=1",
    label: "Book appointment",
    icon: "calendar-plus" as const,
  },
  {
    href: "/dashboard/clients",
    label: "Add customer",
    icon: "user-plus" as const,
  },
  {
    href: "/dashboard/payments",
    label: "Record payment",
    icon: "banknote" as const,
  },
] as const;
