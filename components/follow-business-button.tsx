"use client"

import { useFormStatus } from "react-dom"
import { toggleFollowBusinessAction } from "@/lib/business-follow-actions"
import { Bell, BellOff } from "lucide-react"

function FollowButtonInner({
  isFollowing,
}: {
  isFollowing: boolean
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 disabled:opacity-50 ${
        isFollowing
          ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
          : "bg-secondary/50 hover:bg-secondary"
      }`}
    >
      {isFollowing ? (
        <>
          <BellOff className="h-3.5 w-3.5" />
          Following
        </>
      ) : (
        <>
          <Bell className="h-3.5 w-3.5" />
          Follow
        </>
      )}
    </button>
  )
}

export function FollowBusinessButton({
  businessId,
  slug,
  isFollowing,
}: {
  businessId: number
  slug: string
  isFollowing: boolean
}) {
  return (
    <form action={toggleFollowBusinessAction}>
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="slug" value={slug} />
      <FollowButtonInner isFollowing={isFollowing} />
    </form>
  )
}
