import { redirect, RedirectType } from "next/navigation"

export default function GarageSalesPage() {
  redirect("/feed?type=for_sale", RedirectType.replace)
}
