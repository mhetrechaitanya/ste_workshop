"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"

import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { ImageUpload } from "@/components/ui/image-upload"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import dynamic from "next/dynamic"
import { useTheme } from "@mui/material/styles"
import { format } from 'date-fns';

// Import the RichTextEditor component
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface Category {
  id: number
  name: string
}

const formSchema = z.object({
  name: z.string().min(2, { message: "Workshop name must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  category_id: z.number({ required_error: "Please select a category." }),
  duration_value: z.coerce.number().min(1, { message: "Enter a valid duration." }),
  duration_unit: z.enum(["days", "weeks", "months"], { required_error: "Select a unit." }),
  sessions_per_day: z.coerce.number().min(1, { message: "Enter sessions per day." }),
  minutes_per_session: z.coerce.number().min(1, { message: "Enter minutes per session." }),
  start_date: z.date({ required_error: "Select a start date." }),
  session_start_time: z.string().min(1, { message: "Enter session start time." }),
  fee: z.string().min(1, { message: "Fee is required." }),
  capacity: z.string().min(1, { message: "Capacity is required." }),
  instructor: z.string().min(2, { message: "Instructor name is required." }),
  status: z.string(),
  image: z.string().nullable(),
})

export default function NewWorkshopPage() {
  const { toast } = useToast()
  const router = useRouter()
  const theme = useTheme()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isClient, setIsClient] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category_id: undefined as unknown as number,
      duration_value: 1,
      duration_unit: "days",
      sessions_per_day: 1,
      minutes_per_session: 60,
      start_date: undefined,
      session_start_time: "09:00",
      fee: "",
      capacity: "",
      instructor: "",
      status: "active",
      image: null,
    },
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true })
        if (error) throw error
        setCategories(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load categories. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [toast])

  // Helper function to strip HTML tags for validation
  const stripHtmlTags = (html: string): string => {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Validate description length without HTML tags
    const plainTextDescription = stripHtmlTags(values.description)
    if (plainTextDescription.length < 10) {
      toast({
        title: "Validation Error",
        description: "Description must be at least 10 characters long (excluding formatting).",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.from("workshops").insert([
        {
          name: values.name,
          description: values.description, // HTML
          category_id: values.category_id,
          duration_value: values.duration_value,
          duration_unit: values.duration_unit,
          sessions_per_day: values.sessions_per_day,
          minutes_per_session: values.minutes_per_session,
          start_date: values.start_date ? values.start_date.toISOString() : null,
          session_start_time: values.session_start_time,
          fee: parseFloat(values.fee),
          capacity: parseInt(values.capacity),
          instructor: values.instructor,
          status: values.status,
          image: values.image,
        },
      ])
      if (error) throw error

      toast({
        title: "Workshop Created",
        description: "The workshop has been created successfully.",
      })
      router.push("/workshops")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create workshop. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Workshop</h1>
        <p className="text-muted-foreground">Create a new workshop offering</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workshop Details</CardTitle>
          <CardDescription>Enter the details for the new workshop</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workshop Name</FormLabel>
                      <FormControl><Input placeholder="Web Development Bootcamp" {...field} /></FormControl>
                      <FormDescription>The name of your workshop.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number.parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingCategories ? "Loading..." : "Select a category"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingCategories ? (
                            <div className="p-2 text-sm">Loading...</div>
                          ) : (
                            categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The category of your workshop.
                        <Link href="/workshops/categories" className="ml-1 text-primary hover:underline">
                          Manage categories
                        </Link>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description - Rich Text Editor */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Enter detailed description of the workshop..."
                        />
                      </FormControl>
                      <FormDescription>
                        Detailed description of the workshop. Use the toolbar to format text, add lists, links, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Duration, Sessions, Minutes */}
                <FormField
                  control={form.control}
                  name="duration_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <div className="flex gap-2">
                        <Input type="number" min={1} {...field} placeholder="Enter value" />
                        <FormField
                          control={form.control}
                          name="duration_unit"
                          render={({ field: unitField }) => (
                            <Select value={unitField.value} onValueChange={unitField.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="days">Days</SelectItem>
                                <SelectItem value="weeks">Weeks</SelectItem>
                                <SelectItem value="months">Months</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sessions_per_day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sessions per day</FormLabel>
                      <Input type="number" min={1} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minutes_per_session"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minutes per session</FormLabel>
                      <Input type="number" min={1} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Start Date */}
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={e => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Session Start Time */}
                <FormField
                  control={form.control}
                  name="session_start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fee */}
                <FormField
                  control={form.control}
                  name="fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee (₹)</FormLabel>
                      <FormControl><Input type="number" min="0" {...field} /></FormControl>
                      <FormDescription>Fee in INR.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Capacity */}
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl><Input type="number" min="1" {...field} /></FormControl>
                      <FormDescription>Max number of students.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Instructor */}
                <FormField
                  control={form.control}
                  name="instructor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructor</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Image */}
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Workshop Image</FormLabel>
                      <FormControl>
                        <ImageUpload value={field.value || null} onChange={field.onChange} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>Upload a JPG, PNG, or WEBP (Max: 2MB).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => router.push("/workshops")}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Workshop"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}