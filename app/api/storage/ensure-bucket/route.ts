import { NextResponse } from "next/server"
import { createStorageBucket } from "@/lib/create-storage-bucket"

export async function POST(request: Request) {
  try {
    const { bucketName } = await request.json()

    if (!bucketName) {
      return NextResponse.json({ success: false, error: "Bucket name is required" }, { status: 400 })
    }

    console.log(`API route: Ensuring bucket ${bucketName} exists...`)

    const result = await createStorageBucket(bucketName)

    return NextResponse.json({
      success: result.success,
      message: result.message,
      bucketName,
    })
  } catch (error) {
    console.error("Error in ensure-bucket API route:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
