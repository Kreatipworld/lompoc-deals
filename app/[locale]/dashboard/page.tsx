import { redirect } from "next/navigation"

// The dashboard root has no content — redirect to the profile section
export default function DashboardRootPage() {
  redirect("/dashboard/profile")
}
