"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState } from "react"

interface SidebarItemProps {
  href: string
  icon: React.ReactNode
  title: string
  isActive: boolean
}

function SidebarItem({ href, icon, title, isActive }: SidebarItemProps) {
  return (
    <Link href={href} className="w-full">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-2 font-normal",
          isActive ? "bg-stei-red/10 text-stei-red font-medium" : "hover:bg-stei-red/5",
        )}
      >
        {isActive ? (
          <div className="h-5 w-5 flex items-center justify-center text-stei-red">{icon}</div>
        ) : (
          <div className="h-5 w-5 flex items-center justify-center text-muted-foreground">{icon}</div>
        )}
        {title}
      </Button>
    </Link>
  )
}

interface SidebarGroupProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function SidebarGroup({ icon, title, children, defaultOpen = false }: SidebarGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 font-normal hover:bg-stei-red/5">
          <div className="h-5 w-5 flex items-center justify-center text-muted-foreground">{icon}</div>
          {title}
          {isOpen ? <ChevronDown className="ml-auto h-4 w-4" /> : <ChevronRight className="ml-auto h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6">{children}</CollapsibleContent>
    </Collapsible>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  // Helper function to check if a path is active
  const isPathActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard"
    }
    // For other paths, check if the pathname starts with the path
    return pathname.startsWith(path)
  }

  return (
    <div className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-white dark:bg-black md:flex">
      <div className="flex h-16 items-center border-b px-4">
        <h1 className="text-xl font-bold text-stei-red flex items-center">
          <div className="h-8 w-8 rounded-full bg-stei-red mr-2 flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          STEI Admin
        </h1>
      </div>
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col gap-1">
          <SidebarItem
            href="/dashboard"
            icon={<Home className="h-5 w-5" />}
            title="Dashboard"
            isActive={pathname === "/dashboard"}
          />

          <SidebarGroup
            icon={<BookOpen className="h-5 w-5" />}
            title="Workshops"
            defaultOpen={isPathActive("/workshops")}
          >
            <SidebarItem
              href="/workshops"
              icon={<BookOpen className="h-4 w-4" />}
              title="All Workshops"
              isActive={pathname === "/workshops"}
            />
            <SidebarItem
              href="/workshops/new"
              icon={<FileText className="h-4 w-4" />}
              title="Add Workshop"
              isActive={pathname === "/workshops/new"}
            />
          </SidebarGroup>

          <SidebarGroup icon={<Calendar className="h-5 w-5" />} title="Batches" defaultOpen={isPathActive("/batches")}>
            <SidebarItem
              href="/batches"
              icon={<Calendar className="h-4 w-4" />}
              title="All Batches"
              isActive={pathname === "/batches"}
            />
            <SidebarItem
              href="/batches/new"
              icon={<FileText className="h-4 w-4" />}
              title="Add Batch"
              isActive={pathname === "/batches/new"}
            />
          </SidebarGroup>

          <SidebarGroup icon={<Users className="h-5 w-5" />} title="Students" defaultOpen={isPathActive("/students")}>
            <SidebarItem
              href="/students"
              icon={<Users className="h-4 w-4" />}
              title="All Students"
              isActive={pathname === "/students"}
            />
            <SidebarItem
              href="/students/new"
              icon={<FileText className="h-4 w-4" />}
              title="Add Student"
              isActive={pathname === "/students/new"}
            />
          </SidebarGroup>

          <SidebarItem
            href="/payments"
            icon={<CreditCard className="h-5 w-5" />}
            title="Payments"
            isActive={isPathActive("/payments")}
          />

          <SidebarGroup icon={<Mail className="h-5 w-5" />} title="Email" defaultOpen={isPathActive("/email")}>
            <SidebarItem
              href="/email/send"
              icon={<Mail className="h-4 w-4" />}
              title="Send Email"
              isActive={pathname === "/email/send"}
            />
            <SidebarItem
              href="/email/templates"
              icon={<FileText className="h-4 w-4" />}
              title="Email Templates"
              isActive={pathname === "/email/templates"}
            />
            <SidebarItem
              href="/email/templates/new"
              icon={<FileText className="h-4 w-4" />}
              title="New Template"
              isActive={pathname === "/email/templates/new"}
            />
          </SidebarGroup>

          <SidebarItem
            href="/settings"
            icon={<Settings className="h-5 w-5" />}
            title="Settings"
            isActive={isPathActive("/settings")}
          />
        </nav>
      </ScrollArea>
    </div>
  )
}
