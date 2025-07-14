import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

const BUCKET_NAME = "workshop-images"
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

export async function POST(request: Request) {
  try {
    // First, check if required environment variables are set
    if (!SUPABASE_URL) {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
      return NextResponse.json({ 
        success: false, 
        error: "Server configuration error: Missing Supabase URL" 
      }, { status: 500 })
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable")
      return NextResponse.json({ 
        success: false, 
        error: "Server configuration error: Missing Supabase service role key" 
      }, { status: 500 })
    }

    console.log("Processing upload request...")
    
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      console.error("No file provided in request")
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    console.log(`File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`)

    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      console.error(`File too large: ${file.size} bytes`)
      return NextResponse.json({ success: false, error: "File size must be less than 2MB" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      console.error(`Invalid file type: ${file.type}`)
      return NextResponse.json(
        { success: false, error: "File must be in JPG, JPEG, PNG, or WEBP format" },
        { status: 400 },
      )
    }

    // Generate a unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`
    console.log(`Generated filename: ${fileName}`)

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log(`File converted to buffer: ${buffer.length} bytes`)

    // Upload directly to Supabase Storage using fetch
    const endpoint = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${fileName}`
    console.log(`Upload endpoint: ${endpoint}`)

    const uploadResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
        "x-upsert": "true",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: buffer,
    })

    console.log(`Upload response status: ${uploadResponse.status} ${uploadResponse.statusText}`)

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error("Upload error response:", errorText)
      
      // Try to parse the error response for more details
      let errorMessage = `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.message) {
          errorMessage = errorData.message
        }
      } catch (parseError) {
        // If we can't parse as JSON, use the raw text
        if (errorText) {
          errorMessage = errorText
        }
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 },
      )
    }

    // Construct the public URL
    const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`
    console.log(`File uploaded successfully. Public URL: ${fileUrl}`)

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
