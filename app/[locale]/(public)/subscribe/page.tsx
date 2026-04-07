import { SubscribeForm } from "./subscribe-form"

export const metadata = { title: "Subscribe — Lompoc Deals" }

export default function SubscribePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Weekly digest</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        One email every Saturday morning with the top 10 deals from Lompoc
        businesses. Free, unsubscribe anytime.
      </p>
      <div className="mt-8">
        <SubscribeForm />
      </div>
    </div>
  )
}
