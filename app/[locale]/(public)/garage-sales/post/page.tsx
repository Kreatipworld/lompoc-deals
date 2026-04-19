import { ShoppingBag } from "lucide-react"
import { PostGarageSaleForm } from "./post-form"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Post a Garage Sale — Lompoc Deals",
  description: "List your garage sale or yard sale in Lompoc for free. Locals will find you on the map.",
}

export default async function PostGarageSalePage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login?from=/garage-sales/post")
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100">
          <ShoppingBag className="h-6 w-6 text-orange-600" />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Post a garage sale
        </h1>
        <p className="text-sm text-muted-foreground">
          Free to post. Your sale appears on the map right away — no review needed.
        </p>
      </div>

      <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <PostGarageSaleForm />
      </div>
    </div>
  )
}
