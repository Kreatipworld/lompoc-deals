import { NextResponse } from "next/server"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { eq } from "drizzle-orm"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { users } from "@/db/schema"

// Direct-to-Blob uploads for Lompoc Sales photos (same pattern as listing-photo).
// Any signed-in, non-blocked account may upload, only under sales/<userId>/,
// and only the JPEG/PNG/WebP the browser re-encoded (lib/client-image.ts).
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await auth()
        if (!session?.user) throw new Error("Sign in to add photos")
        const userId = parseInt(session.user.id, 10)
        const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { salesBlockedAt: true } })
        if (!user || user.salesBlockedAt) throw new Error("Not authorized")
        if (!pathname.startsWith(`sales/${userId}/`)) throw new Error("Bad upload path")
        if (/\.(heic|heif)$/i.test(pathname)) throw new Error("HEIC photos can't be shown in a browser — share the photo as JPEG and try again")
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 8 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId }),
        }
      },
      onUploadCompleted: async () => {
        // The form submits the final photo URLs with the listing.
      },
    })
    return NextResponse.json(json)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 400 })
  }
}
