import type React from "react"
import { Sidebar } from "@/components/sidebar-new"
import { Header } from "@/components/header"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"

export async function generateMetadata() {
  const user = await getSession()

  if (!user) {
    redirect("/login")
  }

  return {
    title: "STEI Workshop Management",
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col md:pl-64">
        <Header />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
