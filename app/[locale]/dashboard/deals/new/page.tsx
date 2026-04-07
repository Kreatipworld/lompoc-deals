import { DealForm } from "../deal-form"

export const metadata = { title: "New deal — Lompoc Deals" }

export default function NewDealPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">New deal</h1>
      <DealForm />
    </div>
  )
}
