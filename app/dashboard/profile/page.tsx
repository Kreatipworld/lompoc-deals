import { getCategoriesList, getMyBusiness } from "@/lib/biz-actions"
import { ProfileForm } from "./profile-form"

export const metadata = { title: "Business profile — Lompoc Deals" }

const STATUS_STYLES: Record<string, string> = {
  approved:
    "border-green-200 bg-green-50 text-green-700",
  pending:
    "border-amber-200 bg-amber-50 text-amber-700",
  rejected:
    "border-red-200 bg-red-50 text-red-700",
}

export default async function ProfilePage() {
  const [biz, cats] = await Promise.all([getMyBusiness(), getCategoriesList()])

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Business profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {biz
              ? "Update your details, hours, and images. Changes go live instantly."
              : "Create your business profile to start posting deals to the Lompoc community."}
          </p>
        </div>
        {biz && (
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
              STATUS_STYLES[biz.status] ?? STATUS_STYLES.pending
            }`}
          >
            {biz.status}
          </span>
        )}
      </header>

      <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <ProfileForm biz={biz} categories={cats} />
      </div>
    </div>
  )
}
