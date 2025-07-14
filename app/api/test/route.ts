import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "API is working",
    timestamp: new Date().toISOString(),
    environment: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing",
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Missing",
    }
  })
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: "POST method is working",
    timestamp: new Date().toISOString(),
  })
} 