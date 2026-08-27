export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="h-8 w-48 skeleton rounded" />
      <div className="mt-6 space-y-3">
        <div className="h-12 skeleton rounded" />
        <div className="h-12 skeleton rounded" />
        <div className="h-12 skeleton rounded" />
      </div>
    </div>
  )
}
