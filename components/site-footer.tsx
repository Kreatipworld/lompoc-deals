export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Lompoc Deals — local promotions for Lompoc, CA
      </div>
    </footer>
  )
}
