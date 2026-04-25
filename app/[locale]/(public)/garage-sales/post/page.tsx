import { redirect } from "next/navigation"

export default function GarageSalesPostPage() {
  redirect("/feed/post?type=for_sale")
}
