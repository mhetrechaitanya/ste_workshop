import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Test the database connection
    const { data, error } = await supabase.from("admin_users").select("id, email").limit(1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: data ? "Found admin users" : "No admin users found",
    })
  } catch (error) {
    console.error("Test error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
