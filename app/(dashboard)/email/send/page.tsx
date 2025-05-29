"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2, Mail, Users, Plus } from "lucide-react"
import { Link } from "@/components/ui/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

const formSchema = z.object({
  to: z.string().optional(),
  subject: z.string().min(2, {
    message: "Subject must be at least 2 characters.",
  }),
  template: z.string().optional(),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
  selectedStudents: z.array(z.string()).optional(),
})

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  status: string
}

export default function SendEmailPage() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const toEmail = searchParams.get("to")

  const [templates, setTemplates] = useState<any[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [emailMode, setEmailMode] = useState<"single" | "multiple">("single")
  const [activeTab, setActiveTab] = useState("active")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      to: "",
      subject: "",
      template: "",
      message: "",
      selectedStudents: [],
    },
  })

  useEffect(() => {
    if (toEmail) {
      form.setValue("to", toEmail)
      setEmailMode("single")
    }
  }, [toEmail, form])

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from("email_templates")
          .select("id, name, subject, content")
          .order("name", { ascending: true })

        if (error) throw error
        setTemplates(data || [])
      } catch (error) {
        console.error("Error fetching email templates:", error)
        toast({
          title: "Error",
          description: "Failed to load email templates. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingTemplates(false)
      }
    }

    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase
          .from("students")
          .select("id, first_name, last_name, email, status")
          .order("first_name", { ascending: true })

        if (error) throw error
        setStudents(data || [])
      } catch (error) {
        console.error("Error fetching students:", error)
        toast({
          title: "Error",
          description: "Failed to load students. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingStudents(false)
      }
    }

    fetchTemplates()
    fetchStudents()
  }, [toast])

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Prepare recipients based on mode
    let recipients: string[] = []

    if (emailMode === "single" && values.to) {
      recipients = [values.to]
    } else if (emailMode === "multiple" && selectedStudents.length > 0) {
      recipients = students.filter((student) => selectedStudents.includes(student.id)).map((student) => student.email)
    }

    if (recipients.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one recipient.",
        variant: "destructive",
      })
      return
    }

    console.log({
      ...values,
      recipients,
      selectedStudents,
    })

    toast({
      title: "Email Sent",
      description: `The email has been sent to ${recipients.length} recipient(s).`,
    })
    router.push("/dashboard")
  }

  function onTemplateChange(templateId: string) {
    form.setValue("template", templateId)

    if (templateId === "none") {
      form.setValue("subject", "")
      form.setValue("message", "")
      return
    }

    const selectedTemplate = templates.find((template) => template.id === templateId)
    if (selectedTemplate) {
      form.setValue("subject", selectedTemplate.subject)
      form.setValue("message", selectedTemplate.content)
    }
  }

  const handleSelectAllInCategory = (status: string) => {
    const studentsInCategory = students.filter((student) => student.status === status)
    const studentIds = studentsInCategory.map((student) => student.id)

    // Check if all students in this category are already selected
    const allSelected = studentIds.every((id) => selectedStudents.includes(id))

    if (allSelected) {
      // Deselect all in this category
      setSelectedStudents(selectedStudents.filter((id) => !studentIds.includes(id)))
    } else {
      // Select all in this category
      const newSelected = [...selectedStudents]
      studentIds.forEach((id) => {
        if (!newSelected.includes(id)) {
          newSelected.push(id)
        }
      })
      setSelectedStudents(newSelected)
    }

    // Update form value
    form.setValue("selectedStudents", selectedStudents)
  }

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchQuery === "" ||
      student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab = activeTab === "all" || student.status === activeTab

    return matchesSearch && matchesTab
  })

  const getStudentsByStatus = (status: string) => {
    return students.filter((student) => student.status === status)
  }

  const activeStudents = getStudentsByStatus("active")
  const pendingStudents = getStudentsByStatus("pending")
  const inactiveStudents = getStudentsByStatus("inactive")

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Send Email</h1>
        <p className="text-muted-foreground">Send emails to students</p>
      </div>

      <Card className="border-none shadow-lg overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-950">
        <CardHeader className="border-b pb-6">
          <CardTitle className="text-2xl font-bold text-stei-red">Email Composer</CardTitle>
          <CardDescription>Compose and send an email to students</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-stei-red flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Recipients
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant={emailMode === "single" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEmailMode("single")}
                        className={
                          emailMode === "single"
                            ? "bg-stei-red hover:bg-stei-red/90"
                            : "hover:border-stei-red hover:text-stei-red"
                        }
                      >
                        Single
                      </Button>
                      <Button
                        type="button"
                        variant={emailMode === "multiple" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEmailMode("multiple")}
                        className={
                          emailMode === "multiple"
                            ? "bg-stei-red hover:bg-stei-red/90"
                            : "hover:border-stei-red hover:text-stei-red"
                        }
                      >
                        Multiple
                      </Button>
                    </div>
                  </div>

                  {emailMode === "single" ? (
                    <FormField
                      control={form.control}
                      name="to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To</FormLabel>
                          <FormControl>
                            <Input placeholder="student@example.com" {...field} />
                          </FormControl>
                          <FormDescription>Recipient's email address.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <div className="border rounded-md p-4 bg-white dark:bg-gray-950 shadow-sm">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b">
                        <h4 className="text-sm font-medium flex items-center">
                          <Users className="h-4 w-4 mr-2 text-stei-red" />
                          Select Students
                        </h4>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-[200px] h-8 text-sm"
                          />
                          <Badge variant="outline" className="ml-2 bg-stei-red/10 text-stei-red border-stei-red/20">
                            {selectedStudents.length} selected
                          </Badge>
                        </div>
                      </div>

                      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="mb-4 bg-gray-100 dark:bg-gray-900 p-1 rounded-md">
                          <TabsTrigger
                            value="active"
                            className="data-[state=active]:bg-stei-red data-[state=active]:text-white"
                          >
                            Active ({activeStudents.length})
                          </TabsTrigger>
                          <TabsTrigger
                            value="pending"
                            className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"
                          >
                            Pending ({pendingStudents.length})
                          </TabsTrigger>
                          <TabsTrigger
                            value="inactive"
                            className="data-[state=active]:bg-gray-500 data-[state=active]:text-white"
                          >
                            Inactive ({inactiveStudents.length})
                          </TabsTrigger>
                          <TabsTrigger
                            value="all"
                            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                          >
                            All ({students.length})
                          </TabsTrigger>
                        </TabsList>

                        {["active", "pending", "inactive", "all"].map((status) => (
                          <TabsContent key={status} value={status} className="m-0">
                            {isLoadingStudents ? (
                              <div className="flex justify-center items-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                              </div>
                            ) : filteredStudents.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">No students found.</div>
                            ) : (
                              <>
                                <div className="flex items-center mb-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                                  <Checkbox
                                    id={`select-all-${status}`}
                                    checked={
                                      status === "all"
                                        ? selectedStudents.length === students.length
                                        : getStudentsByStatus(status).every((s) => selectedStudents.includes(s.id))
                                    }
                                    onCheckedChange={() => handleSelectAllInCategory(status)}
                                    className="data-[state=checked]:bg-stei-red data-[state=checked]:border-stei-red"
                                  />
                                  <label
                                    htmlFor={`select-all-${status}`}
                                    className="ml-2 text-sm font-medium cursor-pointer"
                                  >
                                    Select all {status === "all" ? "students" : `${status} students`}
                                  </label>
                                </div>

                                <ScrollArea className="h-[300px] pr-4 border rounded-md bg-white/50 dark:bg-black/50">
                                  <div className="space-y-2">
                                    {filteredStudents.map((student) => (
                                      <div
                                        key={student.id}
                                        className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-md transition-colors duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-800"
                                      >
                                        <Checkbox
                                          id={`student-${student.id}`}
                                          checked={selectedStudents.includes(student.id)}
                                          onCheckedChange={() => handleStudentSelect(student.id)}
                                        />
                                        <label htmlFor={`student-${student.id}`} className="ml-2 flex-1 cursor-pointer">
                                          <div className="flex justify-between items-center">
                                            <div>
                                              <p className="text-sm font-medium">
                                                {student.first_name} {student.last_name}
                                              </p>
                                              <p className="text-xs text-muted-foreground">{student.email}</p>
                                            </div>
                                            <Badge
                                              variant="outline"
                                              className={
                                                student.status === "active"
                                                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                                                  : student.status === "pending"
                                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
                                                    : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800"
                                              }
                                            >
                                              {student.status}
                                            </Badge>
                                          </div>
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </>
                            )}
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>
                  )}
                </div>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-950 px-4 text-sm text-muted-foreground">
                      Email Content
                    </span>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          onTemplateChange(value)
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-gray-200 focus:border-stei-red focus:ring-stei-red/20">
                            <SelectValue
                              placeholder={isLoadingTemplates ? "Loading templates..." : "Select a template (optional)"}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none" className="font-medium">
                            No Template
                          </SelectItem>
                          {isLoadingTemplates ? (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin mr-2 text-stei-red" />
                              <span>Loading templates...</span>
                            </div>
                          ) : templates.length === 0 ? (
                            <div className="p-4 text-center border-t mt-2">
                              <p className="text-sm text-muted-foreground mb-2">No templates found.</p>
                              <Link
                                href="/email/templates/new"
                                className="text-xs text-stei-red hover:underline inline-flex items-center"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Create your first template
                              </Link>
                            </div>
                          ) : (
                            templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>Select an email template or create a custom message.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-stei-red"></span>
                        Subject
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Email subject"
                          {...field}
                          className="border-gray-200 focus:border-stei-red focus:ring-stei-red/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-stei-red"></span>
                        Message
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Type your message here..."
                          className="min-h-[300px] font-mono text-sm resize-y border-gray-200 focus:border-stei-red focus:ring-stei-red/20"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs mt-2 flex items-center">
                        <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                        Use placeholders like [Student Name], [Workshop Name], etc. for dynamic content.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-6 border-t mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-stei-red hover:bg-stei-red/90 transition-colors shadow-md hover:shadow-lg"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {emailMode === "multiple" && selectedStudents.length > 0
                    ? `Send to ${selectedStudents.length} recipient${selectedStudents.length > 1 ? "s" : ""}`
                    : "Send Email"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
