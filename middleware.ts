import { auth } from "@/auth"

export default auth((req) => {
  const role = req.auth?.user?.role
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/dashboard") && role !== "business") {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("from", pathname)
    return Response.redirect(url)
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("from", pathname)
    return Response.redirect(url)
  }
})

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
