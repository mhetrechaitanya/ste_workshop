"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BookOpen,
  Users,
  Calendar,
  CreditCard,
  Mail,
  FileText,
  Settings,
  Home,
  ChevronDown,
  ChevronRight,
  Quote,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()

  // State for tracking which sections are expanded
  const [expandedSections, setExpandedSections] = useState({
    workshops: pathname.startsWith("/workshops"),
    batches: pathname.startsWith("/batches"),
    students: pathname.startsWith("/students"),
    email: pathname.startsWith("/email"),
  })

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Handle navigation with feedback
  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <div className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-white dark:bg-black md:flex">
      <div className="flex h-16 items-center justify-center border-b px-4 bg-white dark:bg-black">
        <div
          className="flex items-center justify-center cursor-pointer w-full"
          onClick={() => handleNavigation("/dashboard")}
        >
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/STEI-Logo-%281%29-R6caTgIfzJ9965RRHYktjr8bxdrBYw.png"
            alt="STEI Logo"
            width={140}
            height={56}
            className="object-contain mx-auto"
            priority
          />
        </div>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1.5">
          {/* Dashboard */}
          <Link href="/dashboard" className="w-full">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 font-normal transition-all duration-200",
                pathname === "/dashboard"
                  ? "bg-stei-red text-white font-medium shadow-md"
                  : "hover:bg-stei-red/10 hover:translate-x-1",
              )}
              onClick={() => handleNavigation("/dashboard")}
            >
              <Home className="h-5 w-5" />
              Dashboard
            </Button>
          </Link>

          {/* Workshops Section */}
          <div className="w-full mt-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 font-normal hover:bg-stei-red/5 transition-all duration-200 hover:translate-x-1"
              onClick={() => toggleSection("workshops")}
            >
              <BookOpen className="h-5 w-5 text-stei-red" />
              Workshops
              {expandedSections.workshops ? (
                <ChevronDown className="ml-auto h-4 w-4" />
              ) : (
                <ChevronRight className="ml-auto h-4 w-4" />
              )}
            </Button>

            {expandedSections.workshops && (
              <div className="pl-6 flex flex-col gap-1 mt-1 border-l-2 border-stei-red/20 ml-2.5">
                <Link href="/workshops" className="w-full">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 font-normal transition-all duration-200",
                      pathname === "/workshops"
                        ? "bg-stei-red/10 text-stei-red font-medium"
                        : "hover:bg-stei-red/5 hover:translate-x-1",
                    )}
                  >
                    <BookOpen
                      className={cn("h-4 w-4", pathname === "/workshops" ? "text-stei-red" : "text-muted-foreground")}
                    />
                    All Workshops
                  </Button>
                </Link>
                <Link href="/workshops/new" className="w-full">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 font-normal transition-all duration-200",
                      pathname === "/workshops/new"
                        ? "bg-stei-red/10 text-stei-red font-medium"
                        : "hover:bg-stei-red/5 hover:translate-x-1",
                    )}
                  >
                    <FileText
                      className={cn(
                        "h-4 w-4",
                        pathname === "/workshops/new" ? "text-stei-red" : "text-muted-foreground",
                      )}
                    />
                    Add Workshop
                  </Button>
                </Link>
                <Link href="/workshops/categories" className="w-full">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 font-normal transition-all duration-200",
                      pathname === "/workshops/categories"
                        ? "bg-stei-red/10 text-stei-red font-medium"
                        : "hover:bg-stei-red/5 hover:translate-x-1",
                    )}
                  >
                    <FileText
                      className={cn(
                        "h-4 w-4",
                        pathname === "/workshops/categories" ? "text-stei-red" : "text-muted-foreground",
                      )}
                    />
                    Categories
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Batches Section */}
          <div className="w-full mt-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 font-normal hover:bg-stei-red/5 transition-all duration-200 hover:translate-x-1"
              onClick={() => toggleSection("batches")}
            >
              <Calendar className="h-5 w-5 text-blue-500" />
              Batches
              {expandedSections.batches ? (
                <ChevronDown className="ml-auto h-4 w-4" />
              ) : (
                <ChevronRight className="ml-auto h-4 w-4" />
              )}
            </Button>

            {expandedSections.batches && (
              <div className="pl-6 flex flex-col gap-1 mt-1 border-l-2 border-blue-500/20 ml-2.5">
                <Link href="/batches" className="w-full">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 font-normal transition-all duration-200",
                      pathname === "/batches"
                        ? "bg-blue-500/10 text-blue-500 font-medium"
                        : "hover:bg-blue-500/5 hover:translate-x-1",
                    )}
                  >
                    <Calendar
                      className={cn("h-4 w-4", pathname === "/batches" ? "text-blue-500" : "text-muted-foreground")}
                    />
                    All Batches
                  </Button>
                </Link>
                <Link href="/batches/new" className="w-full">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 font-normal transition-all duration-200",
                      pathname === "/batches/new"
                        ? "bg-blue-500/10 text-blue-500 font-medium"
                        : "hover:bg-blue-500/5 hover:translate-x-1",
                    )}
                  >
                    <FileText
                      className={cn("h-4 w-4", pathname === "/batches/new" ? "text-blue-500" : "text-muted-foreground")}
                    />
                    Add Batch
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Students Section */}
          <div className="w-full mt-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 font-normal hover:bg-stei-red/5 transition-all duration-200 hover:translate-x-1"
              onClick={() => toggleSection("students")}
            >
              <Users className="h-5 w-5 text-amber-500" />
              Students
              {expandedSections.students ? (
                <ChevronDown className="ml-auto h-4 w-4" />
              ) : (
                <ChevronRight className="ml-auto h-4 w-4" />
              )}
            </Button>

            {expandedSections.students && (
              <div className="pl-6 flex flex-col gap-1 mt-1 border-l-2 border-amber-500/20 ml-2.5">
                <Link href="/students" className="w-full">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 font-normal transition-all duration-200",
                      pathname === "/students"
                        ? "bg-amber-500/10 text-amber-500 font-medium"
                        : "hover:bg-amber-500/5 hover:translate-x-1",
                    )}
                  >
                    <Users
                      className={cn("h-4 w-4", pathname === "/students" ? "text-amber-500" : "text-muted-foreground")}
                    />
                    All Students
                  </Button>
                </Link>
                <Link href="/students/new" className="w-full">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 font-normal transition-all duration-200",
                      pathname === "/students/new"
                        ? "bg-amber-500/10 text-amber-500 font-medium"
                        : "hover:bg-amber-500/5 hover:translate-x-1",
                    )}
                  >
                    <FileText
                      className={cn(
                        "h-4 w-4",
                        pathname === "/students/new" ? "text-amber-500" : "text-muted-foreground",
                      )}
                    />
                    Add Student
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Payments */}
          <Link href="/payments" className="w-full mt-2">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 font-normal transition-all duration-200",
                pathname === "/payments"
                  ? "bg-emerald-500/10 text-emerald-500 font-medium"
                  : "hover:bg-emerald-500/5 hover:translate-x-1",
              )}
            >
              <CreditCard
                className={cn("h-5 w-5", pathname === "/payments" ? "text-emerald-500" : "text-emerald-500")}
              />
              Payments
            </Button>
          </Link>

          {/* Email Section */}
          <div className="w-full mt-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 font-normal hover:bg-stei-red/5 transition-all duration-200 hover:translate-x-1"
              onClick={() => toggleSection("email")}
            >
              <Mail className="h-5 w-5 text-purple-500" />
              Email
              {expandedSections.email ? (
                <ChevronDown className="ml-auto h-4 w-4" />
              ) : (
                <ChevronRight className="ml-auto h-4 w-4" />
              )}
            </Button>

            {expandedSections.email && (
              <div className="pl-6 flex flex-col gap-1 mt-1 border-l-2 border-purple-500/20 ml-2.5">
                <Link href="/email/send" className="w-full">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 font-normal transition-all duration-200",
                      pathname === "/email/send"
                        ? "bg-purple-500/10 text-purple-500 font-medium"
                        : "hover:bg-purple-500/5 hover:translate-x-1",
                    )}
                  >
                    <Mail
                      className={cn(
                        "h-4 w-4",
                        pathname === "/email/send" ? "text-purple-500" : "text-muted-foreground",
                      )}
                    />
                    Send Email
                  </Button>
                </Link>
                <Link href="/email/templates" className="w-full">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 font-normal transition-all duration-200",
                      pathname === "/email/templates"
                        ? "bg-purple-500/10 text-purple-500 font-medium"
                        : "hover:bg-purple-500/5 hover:translate-x-1",
                    )}
                  >
                    <FileText
                      className={cn(
                        "h-4 w-4",
                        pathname === "/email/templates" ? "text-purple-500" : "text-muted-foreground",
                      )}
                    />
                    Email Templates
                  </Button>
                </Link>
                <Link href="/email/templates/new" className="w-full">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 font-normal transition-all duration-200",
                      pathname === "/email/templates/new"
                        ? "bg-purple-500/10 text-purple-500 font-medium"
                        : "hover:bg-purple-500/5 hover:translate-x-1",
                    )}
                  >
                    <FileText
                      className={cn(
                        "h-4 w-4",
                        pathname === "/email/templates/new" ? "text-purple-500" : "text-muted-foreground",
                      )}
                    />
                    New Template
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Quotes */}
          <Link href="/quotes" className="w-full mt-2">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 font-normal transition-all duration-200",
                pathname === "/quotes"
                  ? "bg-purple-500/10 text-purple-500 font-medium"
                  : "hover:bg-purple-500/5 hover:translate-x-1",
              )}
            >
              <Quote className={cn("h-5 w-5", pathname === "/quotes" ? "text-purple-500" : "text-purple-500/70")} />
              Quotes
            </Button>
          </Link>

          {/* Settings */}
          <Link href="/settings" className="w-full mt-2">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 font-normal transition-all duration-200",
                pathname === "/settings"
                  ? "bg-stei-red/10 text-stei-red font-medium"
                  : "hover:bg-stei-red/5 hover:translate-x-1",
              )}
            >
              <Settings className={cn("h-5 w-5", pathname === "/settings" ? "text-stei-red" : "text-stei-red/70")} />
              Settings
            </Button>
          </Link>
        </nav>
      </ScrollArea>
      <div className="p-4 border-t">
        <div
          className="bg-white dark:bg-black p-3 rounded-lg border cursor-pointer"
          onClick={() => {
            toast({
              title: "User Profile",
              description: "View and edit your profile settings",
            })
            router.push("/settings")
          }}
        >
          <p className="text-xs text-muted-foreground">Logged in as</p>
          <p className="font-medium">Admin User</p>
        </div>
      </div>
    </div>
  )
}
