export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="h-8 w-32 skeleton rounded" />
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-40 skeleton rounded-lg border" />
        <div className="h-40 skeleton rounded-lg border" />
      </div>
    </div>
  )
}
