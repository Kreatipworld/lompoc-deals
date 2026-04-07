import { notFound } from "next/navigation"
import { getMyDealById } from "@/lib/biz-actions"
import { DealForm } from "../../deal-form"

export const metadata = { title: "Edit deal — Lompoc Deals" }

export default async function EditDealPage({
  params,
}: {
  params: { id: string }
}) {
  const deal = await getMyDealById(parseInt(params.id, 10))
  if (!deal) notFound()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Edit deal</h1>
      <DealForm deal={deal} />
    </div>
  )
}
