import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

const BUCKET_NAME = "workshop-images"
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || ""
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || ""

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File size must be less than 2MB" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "File must be in JPG, JPEG, PNG, or WEBP format" },
        { status: 400 },
      )
    }

    // Generate a unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload directly to Supabase Storage using fetch
    const endpoint = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${fileName}`

    const uploadResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
        "x-upsert": "true",
        // Authorization: `Bearer ${S3_SECRET_ACCESS_KEY}`,
        // apikey: S3_ACCESS_KEY_ID,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,

      },
      body: buffer,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error("Upload error:", errorText)
      return NextResponse.json(
        { success: false, error: `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}` },
        { status: 500 },
      )
    }

    // Construct the public URL
    const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName,
    })
  } catch (error) {
    console.error("Error uploading to S3:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
