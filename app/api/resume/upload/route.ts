import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("resume") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 })
    }

    // 1. Validate file extension & size
    const allowedExtensions = ['pdf', 'docx']
    const ext = file.name.split('.').pop()?.toLowerCase()
    
    if (!ext || !allowedExtensions.includes(ext)) {
      return NextResponse.json({ success: false, error: "Unsupported file type. Only PDF and DOCX are allowed." }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File too large. Maximum size is 10 MB." }, { status: 400 })
    }

    // 2. Magic bytes validation
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // PDF magic bytes: %PDF (25 50 44 46)
    // DOCX (ZIP) magic bytes: PK\x03\x04 (50 4b 03 04)
    if (ext === 'pdf') {
      if (buffer.length < 4 || buffer.toString('utf8', 0, 4) !== '%PDF') {
        return NextResponse.json({ success: false, error: "Invalid PDF file signature." }, { status: 400 })
      }
    } else if (ext === 'docx') {
      if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
        return NextResponse.json({ success: false, error: "Invalid DOCX file signature." }, { status: 400 })
      }
    }

    // 3. Generate secure unique filename
    const uniqueId = crypto.randomUUID()
    const storagePath = `${user.id}/${uniqueId}.${ext}`

    // 4. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ success: false, error: "Failed to store resume securely." }, { status: 500 })
    }

    // 5. Create database record
    // We try to insert with source_type, but if it fails because the column doesn't exist, we fallback
    // We use a robust insert.
    let dbRecord = {
      user_id: user.id,
      file_name: file.name,
      file_type: file.type || (ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
      file_size: file.size,
      file_url: storagePath,
      pdf_path: ext === 'pdf' ? storagePath : null,
      status: 'ready', // Ready for next phase (Intelligence)
      title: "Uploaded Resume"
    }

    // We'll try to insert. If it fails with 'column "source_type" does not exist', we retry without it.
    let { data: insertData, error: insertError } = await supabase
      .from("resumes")
      .insert({ ...dbRecord, source_type: 'upload' } as any)
      .select()
      .single()

    if (insertError && insertError.message.includes("source_type")) {
      console.warn("source_type column missing, inserting without it.")
      const retry = await supabase
        .from("resumes")
        .insert(dbRecord)
        .select()
        .single()
      
      insertData = retry.data
      insertError = retry.error
    }

    if (insertError) {
      console.error("Database insert error:", insertError)
      // Cleanup storage if DB insert fails
      await supabase.storage.from("resumes").remove([storagePath])
      return NextResponse.json({ success: false, error: "Failed to save resume record." }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      resume: {
        id: insertData.id,
        fileName: insertData.file_name,
        fileType: ext,
        status: insertData.status
      }
    })

  } catch (error: any) {
    console.error("Unexpected upload error:", error)
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during upload." },
      { status: 500 }
    )
  }
}
