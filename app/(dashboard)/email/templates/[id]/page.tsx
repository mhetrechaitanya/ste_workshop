"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit, Mail, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  created_at: string
  updated_at: string
}

export default function EmailTemplateDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTemplateData()
  }, [params.id])

  const fetchTemplateData = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("email_templates").select("*").eq("id", params.id).single()

      if (error) throw error
      setTemplate(data)
    } catch (error) {
      console.error("Error fetching template data:", error)
      toast({
        title: "Error",
        description: "Failed to load template details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseTemplate = () => {
    router.push(`/email/send?template=${params.id}`)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading template details...</p>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <p className="text-lg mb-4">Template not found</p>
        <Button onClick={() => router.push("/email/templates")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{template.name}</h1>
          <p className="text-muted-foreground">Email template details</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleUseTemplate}>
          <Mail className="mr-2 h-4 w-4" />
          Use Template
        </Button>
        <Link href={`/email/templates/${template.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Template
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
          <CardDescription>
            Created on {formatDate(template.created_at)}
            {template.updated_at && template.updated_at !== template.created_at
              ? ` • Last updated on ${formatDate(template.updated_at)}`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Subject</h3>
            <p className="text-lg font-medium">{template.subject}</p>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Content</h3>
            <div className="bg-muted/30 p-4 rounded-md whitespace-pre-wrap font-mono text-sm">{template.content}</div>
          </div>

          <div className="bg-muted/20 p-4 rounded-md">
            <h3 className="text-sm font-medium mb-2">Available Placeholders</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <li>
                <code>[Student Name]</code> - Student's full name
              </li>
              <li>
                <code>[Workshop Name]</code> - Workshop name
              </li>
              <li>
                <code>[Batch Name]</code> - Batch name
              </li>
              <li>
                <code>[Start Date]</code> - Batch start date
              </li>
              <li>
                <code>[Schedule]</code> - Batch schedule
              </li>
              <li>
                <code>[Location]</code> - Batch location
              </li>
              <li>
                <code>[Instructor]</code> - Instructor name
              </li>
              <li>
                <code>[Fee]</code> - Workshop fee
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>This is how the email will look with placeholders filled</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-6">
            <div className="mb-4">
              <div className="font-medium mb-2">Subject: {template.subject}</div>
              <Separator />
            </div>
            <div className="whitespace-pre-wrap">
              {template.content
                .replace(/\[Student Name\]/g, "John Doe")
                .replace(/\[Workshop Name\]/g, "Web Development Bootcamp")
                .replace(/\[Batch Name\]/g, "Batch #4")
                .replace(/\[Start Date\]/g, "15 Apr 2025")
                .replace(/\[Schedule\]/g, "Mon, Wed, Fri (9:00 AM - 11:00 AM)")
                .replace(/\[Location\]/g, "Room 101, STEI Building")
                .replace(/\[Instructor\]/g, "Rahul Mehta")
                .replace(/\[Fee\]/g, "₹15,000")}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
