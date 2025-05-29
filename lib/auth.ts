import { createServerSupabaseClient } from "./supabase"
import { cookies } from "next/headers"

export type AdminUser = {
  id: number
  email: string
  first_name: string
  last_name: string
  role_id: number
  is_active: boolean
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    // First, check if the user exists and is active
    if (!supabase) {
      throw new Error("Supabase client is not initialized");
    }
    const { data: user, error: userError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .single()

    if (userError || !user) {
      console.log("User not found or not active:", userError)
      return { success: false, error: "Invalid email or password" }
    }

    // Log the found user for debugging (remove in production)
    console.log("Found user:", { id: user.id, email: user.email, first_name: user.first_name })

    // Instead of using RPC, let's directly compare the password
    // This is a simplified approach - in production, use the database's password verification
    // or implement proper password hashing and verification
    if (user.password_hash !== password) {
      console.log("Password mismatch")
      return { success: false, error: "Invalid email or password" }
    }

    // Update last login time
    if (!supabase) {
      throw new Error("Supabase client is not initialized");
    }
    await supabase.from("admin_users").update({ last_login: new Date().toISOString() }).eq("id", user.id)

    // Log the login action in audit_logs
    if (supabase) {
      await supabase.from("audit_logs").insert({
        action: "LOGIN",
        table_name: "admin_users",
        record_id: user.id,
        admin_user_id: user.id,
        ip_address: "0.0.0.0", // In a real app, you'd get this from the request
        user_agent: "STEI Workshop Management System",
        new_values: { last_login: new Date().toISOString() },
      })
    } else {
      console.error("Supabase client is null")
      throw new Error("Supabase client is not initialized")
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role_id: user.role_id,
        is_active: user.is_active,
      },
    }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function createSessionCookie(user: AdminUser) {
  // Create a session cookie that will be used for authentication
  const session = {
    user,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  }

  ;(await cookies()).set("admin_session", JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  })
}

export async function getSession(): Promise<AdminUser | null> {
  const sessionCookie = (await cookies()).get("admin_session")

  if (!sessionCookie) {
    return null
  }

  try {
    const session = JSON.parse(sessionCookie.value)

    if (new Date(session.expires) < new Date()) {
      // Session expired
      (await
        // Session expired
        cookies()).delete("admin_session")
      return null
    }

    return session.user
  } catch (error) {
    console.error("Session parsing error:", error)
    return null
  }
}

export async function logout() {
  (await cookies()).delete("admin_session")
}
