import type React from "react"
import { LoginBackground } from "./login/background"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <LoginBackground />

      {/* Content */}
      <div className="z-10 w-full max-w-md px-4">{children}</div>
    </div>
  )
}
