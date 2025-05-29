import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login"

  // Get the session cookie
  const sessionCookie = request.cookies.get("admin_session")?.value

  // If the path is not public and there's no session, redirect to login
  if (!isPublicPath && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If the path is login and there's a session, redirect to dashboard
  if (isPublicPath && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
