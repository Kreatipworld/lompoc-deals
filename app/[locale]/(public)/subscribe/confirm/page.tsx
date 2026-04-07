import { Link } from "@/i18n/navigation"
import { confirmSubscriptionByToken } from "@/lib/subscribe-actions"

export const metadata = { title: "Confirm subscription — Lompoc Deals" }

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token ?? ""
  const result = token
    ? await confirmSubscriptionByToken(token)
    : { ok: false as const, message: "Missing token" }

  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      {result.ok ? (
        <>
          <h1 className="text-2xl font-bold">You&apos;re subscribed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ll send the next digest to <strong>{result.email}</strong> on
            Saturday at 9am.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Couldn&apos;t confirm</h1>
          <p className="mt-2 text-sm text-muted-foreground">{result.message}</p>
        </>
      )}
      <Link
        href="/"
        className="mt-6 inline-block text-sm underline"
      >
        Back to feed
      </Link>
    </div>
  )
}
