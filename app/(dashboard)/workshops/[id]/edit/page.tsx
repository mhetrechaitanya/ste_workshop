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
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { ImageUpload } from "@/components/ui/image-upload"
import { supabase } from "@/lib/supabase"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { format } from 'date-fns';

// Update the formSchema to include image
const formSchema = z.object({
  name: z.string().min(2, { message: "Workshop name must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  category_id: z.number({ required_error: "Please select a category." }),
  duration_value: z.coerce.number().min(1, { message: "Enter a valid duration." }),
  duration_unit: z.enum(["days", "weeks", "months"], { required_error: "Select a unit." }),
  sessions_per_day: z.coerce.number().min(1, { message: "Enter sessions per day." }),
  minutes_per_session: z.coerce.number().min(1, { message: "Enter minutes per session." }),
  // start_date: z.date({ required_error: "Select a start date." }),
  // session_start_time: z.string().min(1, { message: "Enter session start time." }),
  fee: z.string().min(1, { message: "Fee is required." }),
  capacity: z.string().min(1, { message: "Capacity is required." }),
  instructor: z.string().min(2, { message: "Instructor name is required." }),
  status: z.string(),
  image: z.string().nullable(),
})

// Update the interface for Workshop
interface Workshop {
  id: string
  name: string
  description: string
  category_id: number
  selected_dates: string[]
  fee: string
  capacity: string
  instructor: string
  status: string
  image: string | null
}

export default function EditWorkshopPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState([
    { id: 1, name: "Programming" },
    { id: 2, name: "Design" },
    { id: 3, name: "Marketing" },
  ]) // Mock categories
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update the defaultValues in useForm to include image
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
      // start_date: undefined,
      // session_start_time: "09:00",
      fee: "",
      capacity: "",
      instructor: "",
      status: "active",
      image: null,
    },
  })

  // Update the useEffect to fetch real data from Supabase
  useEffect(() => {
    const fetchWorkshopData = async () => {
      try {
        setIsLoading(true)

        // Fetch workshop data
        const { data: workshopData, error } = await supabase
          .from("workshops")
          .select(`
            *,
            categories(name)
          `)
          .eq("id", params.id)
          .single()

        if (error) throw error

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true })

        if (categoriesError) throw categoriesError

        setCategories(categoriesData)

        // Set form values
        form.reset({
          name: workshopData.name,
          description: workshopData.description,
          category_id: workshopData.category_id,
          duration_value: workshopData.duration_value ?? 1,
          duration_unit: workshopData.duration_unit ?? "days",
          sessions_per_day: workshopData.sessions_per_day ?? 1,
          minutes_per_session: workshopData.minutes_per_session ?? 60,
          // start_date: workshopData.start_date ? new Date(workshopData.start_date) : undefined,
          // session_start_time: workshopData.session_start_time ?? "09:00",
          fee: workshopData.fee?.toString() ?? "",
          capacity: workshopData.capacity?.toString() ?? "",
          instructor: workshopData.instructor,
          status: workshopData.status,
          image: workshopData.image,
        })
      } catch (error) {
        console.error("Error fetching workshop data:", error)
        toast({
          title: "Error",
          description: "Failed to load workshop details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        setIsLoadingCategories(false)
      }
    }

    fetchWorkshopData()
  }, [form, params.id, toast])

  // Update the onSubmit function to include image and use Supabase
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)
      const { error } = await supabase
        .from("workshops")
        .update({
          name: values.name,
          description: values.description,
          category_id: values.category_id,
          duration_value: values.duration_value,
          duration_unit: values.duration_unit,
          sessions_per_day: values.sessions_per_day,
          minutes_per_session: values.minutes_per_session,
          // start_date: values.start_date ? values.start_date.toISOString() : null,
          // session_start_time: values.session_start_time,
          fee: Number.parseFloat(values.fee),
          capacity: Number.parseInt(values.capacity),
          instructor: values.instructor,
          status: values.status,
          image: values.image,
        })
        .eq("id", params.id)

      if (error) throw error

      toast({
        title: "Workshop Updated",
        description: "The workshop has been updated successfully.",
      })
      router.push(`/workshops/${params.id}`)
    } catch (error) {
      console.error("Error updating workshop:", error)
      toast({
        title: "Error",
        description: "Failed to update workshop. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Workshop</h1>
          <p className="text-muted-foreground">Update workshop details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workshop Details</CardTitle>
          <CardDescription>Edit the details for this workshop</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Loading workshop data...</p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workshop Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Web Development Bootcamp" {...field} />
                        </FormControl>
                        <FormDescription>The name of your workshop.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Update the category FormField to use category_id */}
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
                              <SelectValue
                                placeholder={isLoadingCategories ? "Loading categories..." : "Select a category"}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingCategories ? (
                              <div className="flex items-center justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Loading...
                              </div>
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
                            placeholder="A comprehensive bootcamp covering HTML, CSS, JavaScript, and more..."
                            className="min-h-[120px]"
                          />
                        </FormControl>
                        <FormDescription>Detailed description of the workshop.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    {/* Start Date - Temporarily Hidden */}
                    {/*
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
                    */}
                    {/* Session Start Time - Temporarily Hidden */}
                    {/*
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
                    */}
                  </div>

                  <FormField
                    control={form.control}
                    name="fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fee (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormDescription>The fee for the workshop in INR.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>Maximum number of students per batch.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instructor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructor</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormDescription>The primary instructor for this workshop.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                        <FormDescription>Current status of the workshop.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Workshop Image</FormLabel>
                        <FormControl>
                          <ImageUpload value={field.value || null} onChange={field.onChange} disabled={isSubmitting} />
                        </FormControl>
                        <FormDescription>
                          Upload an image for this workshop. This will be displayed on the workshop page.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => router.push(`/workshops/${params.id}`)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Workshop"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
