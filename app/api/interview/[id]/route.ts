import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function PATCH(request: NextRequest) {
  try {
    const { interviewId, transcripts, status } = await request.json()

    if (!interviewId) {
      return NextResponse.json({ error: "Missing interviewId" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {}
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const updatePayload: Record<string, unknown> = {}
    if (transcripts !== undefined) updatePayload.transcripts = transcripts
    if (status !== undefined) updatePayload.status = status
    updatePayload.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from("interviews")
      .update(updatePayload)
      .eq("id", interviewId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Interview update error:", error)
      return NextResponse.json({ error: "Failed to save transcript" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
