import { getCategoriesList, getMyBusiness } from "@/lib/biz-actions"
import { ProfileForm } from "./profile-form"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Business profile — Lompoc Deals" }

export default async function ProfilePage() {
  const [biz, cats] = await Promise.all([getMyBusiness(), getCategoriesList()])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business profile</h1>
          <p className="text-sm text-muted-foreground">
            {biz
              ? "Update your details and images."
              : "Create your business profile to start posting deals."}
          </p>
        </div>
        {biz && (
          <Badge variant={biz.status === "approved" ? "default" : "secondary"}>
            {biz.status}
          </Badge>
        )}
      </div>

      <ProfileForm biz={biz} categories={cats} />
    </div>
  )
}
