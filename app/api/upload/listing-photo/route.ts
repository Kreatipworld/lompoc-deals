import { NextResponse } from "next/server"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { getEffectiveTierForUser } from "@/lib/entitlement"
import { TIERS } from "@/lib/stripe"

// Direct-to-Blob uploads for listing photos (Zillow-style uploader). The
// browser asks here for a scoped token, then streams the file straight to
// Vercel Blob — no 1 MB server-action body limit, per-file progress.
// Only a signed-in business owner on a tier with `canListRealEstate` may upload,
// and only under listings/<businessId>/.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await auth()
        if (!session?.user || session.user.role !== "business") throw new Error("Not authorized")
        const userId = parseInt(session.user.id, 10)
        const tier = await getEffectiveTierForUser(userId)
        if (!TIERS[tier].canListRealEstate) throw new Error("Property listings require the Plus plan")
        const biz = await db.query.businesses.findFirst({ where: (b, { eq }) => eq(b.ownerUserId, userId) })
        if (!biz) throw new Error("Create your business profile first")
        if (!pathname.startsWith(`listings/${biz.id}/`)) throw new Error("Bad upload path")
        // Browsers can't display HEIC/HEIF; the uploader re-encodes to JPEG
        // before asking for a token, so anything else here is a bypass.
        if (/\.(heic|heif)$/i.test(pathname)) {
          throw new Error("HEIC photos can't be shown in a browser — please share the photo as JPEG and try again")
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 12 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ businessId: biz.id }),
        }
      },
      onUploadCompleted: async () => {
        // The form submits the final photo URLs; nothing to persist here.
      },
    })
    return NextResponse.json(json)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 400 })
  }
}
