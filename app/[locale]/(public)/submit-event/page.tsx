import { SubmitEventForm } from "./submit-form"
import { CalendarDays } from "lucide-react"

export const metadata = {
  title: "Submit an Event — Lompoc Deals",
  description: "Tell Lompoc about your upcoming event, festival, or business launch.",
}

export default function SubmitEventPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <CalendarDays className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Submit an event
        </h1>
        <p className="text-sm text-muted-foreground">
          Free to post. Events are reviewed before going live — usually within a few hours.
        </p>
      </div>

      <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <SubmitEventForm />
      </div>
    </div>
  )
}
