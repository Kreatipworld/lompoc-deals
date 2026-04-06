import Link from "next/link"
import { unsubscribeByToken } from "@/lib/subscribe-actions"

export const metadata = { title: "Unsubscribe — Lompoc Deals" }

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token ?? ""
  const result = token
    ? await unsubscribeByToken(token)
    : { ok: false as const, message: "Missing token" }

  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      {result.ok ? (
        <>
          <h1 className="text-2xl font-bold">Unsubscribed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <strong>{result.email}</strong> won&apos;t receive any more digest
            emails.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Couldn&apos;t unsubscribe</h1>
          <p className="mt-2 text-sm text-muted-foreground">{result.message}</p>
        </>
      )}
      <Link href="/" className="mt-6 inline-block text-sm underline">
        Back to feed
      </Link>
    </div>
  )
}
