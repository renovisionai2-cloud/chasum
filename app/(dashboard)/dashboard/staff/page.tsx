import { redirect } from "next/navigation";

/** Legacy Staff route — Employee Management lives at /dashboard/employees */
export default function StaffRedirectPage() {
  redirect("/dashboard/employees");
}
