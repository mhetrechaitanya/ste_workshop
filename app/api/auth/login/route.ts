import { type NextRequest, NextResponse } from "next/server"
import { createSessionCookie, loginAdmin } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log("Login attempt for:", email)

    const { success, user, error } = await loginAdmin(email, password)

    if (!success || !user) {
      console.log("Login failed:", error)
      return NextResponse.json({ error: error || "Invalid credentials" }, { status: 401 })
    }

    console.log("Login successful for:", email)

    // Create session cookie
    await createSessionCookie(user)

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
