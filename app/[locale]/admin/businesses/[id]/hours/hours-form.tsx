"use client"

import { useFormStatus } from "react-dom"
import { saveBusinessHoursAdminAction } from "@/lib/admin-actions"
import { DAY_KEYS, DAY_LABELS, isCanonical, type Hours } from "@/lib/hours"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? `${label}…` : label}
    </Button>
  )
}

export function AdminHoursForm({
  businessId,
  initialHours,
  labels,
}: {
  businessId: number
  initialHours: Hours
  labels: { to: string; closed: string; save: string }
}) {
  return (
    <form action={saveBusinessHoursAdminAction} className="space-y-4">
      <input type="hidden" name="businessId" value={businessId} />

      <div className="space-y-2">
        {DAY_KEYS.map((day) => {
          const d = initialHours[day]
          const isClosed = d === null
          return (
            <div key={day} className="flex items-center gap-3 rounded-lg border p-2">
              <span className="w-10 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {DAY_LABELS[day]}
              </span>
              <Input
                type="time"
                name={`hours_${day}_open`}
                defaultValue={isCanonical(d) ? d.open : "09:00"}
                className="h-8 max-w-[110px]"
                disabled={isClosed}
              />
              <span className="text-xs text-muted-foreground">{labels.to}</span>
              <Input
                type="time"
                name={`hours_${day}_close`}
                defaultValue={isCanonical(d) ? d.close : "17:00"}
                className="h-8 max-w-[110px]"
                disabled={isClosed}
              />
              <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  name={`hours_${day}_closed`}
                  defaultChecked={isClosed}
                  onChange={(e) => {
                    const row = e.currentTarget.closest("div")
                    if (!row) return
                    row
                      .querySelectorAll<HTMLInputElement>("input[type=time]")
                      .forEach((i) => (i.disabled = e.currentTarget.checked))
                  }}
                />
                {labels.closed}
              </label>
            </div>
          )
        })}
      </div>

      <SaveButton label={labels.save} />
    </form>
  )
}
