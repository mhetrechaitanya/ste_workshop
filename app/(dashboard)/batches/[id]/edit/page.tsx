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
import { supabase } from "@/lib/supabase"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"

// Form schema for batch editing
const formSchema = z.object({
  batchName: z.string().min(2, {
    message: "Batch name must be at least 2 characters.",
  }),
  startDate: z.date({
    required_error: "Start date is required.",
  }),
  startTime: z.string().min(1, {
    message: "Start time is required.",
  }),
  endDate: z.date({
    required_error: "End date is required.",
  }),
  endTime: z.string().min(1, {
    message: "End time is required.",
  }),
  selectedDates: z.array(z.date()).min(1, {
    message: "Please select at least one date.",
  }),
  instructor: z.string().min(2, {
    message: "Instructor name is required.",
  }),
  location: z.string().min(2, {
    message: "Location is required.",
  }),
  zoomLink: z
    .string()
    .url({
      message: "Please enter a valid Zoom link.",
    })
    .optional()
    .or(z.literal("")),
  zoomId: z.string().optional(),
  zoomPassword: z.string().optional(),
  status: z.string(),
})

// Interface for Batch
interface Batch {
  id: string
  batch_name: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  selected_dates: string[]
  instructor: string
  location: string
  zoom_link: string | null
  zoom_id: string | null
  zoom_password: string | null
  status: string
  workshop_id: number
}

export default function EditBatchPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [batch, setBatch] = useState<Batch | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      batchName: "",
      startDate: new Date(),
      endDate: new Date(),
      startTime: "09:00",
      endTime: "11:00",
      selectedDates: [],
      instructor: "",
      location: "",
      zoomLink: "",
      zoomId: "",
      zoomPassword: "",
      status: "upcoming",
    },
  })

  useEffect(() => {
    if (params?.id) {
      fetchBatchData()
    }
  }, [params?.id])

  const fetchBatchData = async () => {
    try {
      setIsLoading(true)

      // Fetch batch data
      const { data: batchData, error } = await supabase
        .from("batches")
        .select("*")
        .eq("id", params?.id)
        .single()

      if (error) throw error

      setBatch(batchData)

      // Parse dates from ISO strings
      const startDate = new Date(batchData.start_date)
      const endDate = new Date(batchData.end_date)
      const selectedDates = batchData.selected_dates ? batchData.selected_dates.map((d: string) => new Date(d)) : []

      // Set form values
      form.reset({
        batchName: batchData.batch_name,
        startDate: startDate,
        endDate: endDate,
        startTime: batchData.start_time,
        endTime: batchData.end_time,
        selectedDates: selectedDates,
        instructor: batchData.instructor,
        location: batchData.location,
        zoomLink: batchData.zoom_link || "",
        zoomId: batchData.zoom_id || "",
        zoomPassword: batchData.zoom_password || "",
        status: batchData.status,
      })
    } catch (error) {
      console.error("Error fetching batch data:", error)
      toast({
        title: "Error",
        description: "Failed to load batch details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      // Combine date and time for start and end dates
      const startDateTime = new Date(values.startDate)
      const [startHours, startMinutes] = values.startTime.split(":").map(Number)
      startDateTime.setHours(startHours, startMinutes, 0)

      const endDateTime = new Date(values.endDate)
      const [endHours, endMinutes] = values.endTime.split(":").map(Number)
      endDateTime.setHours(endHours, endMinutes, 0)

      // Format dates for database
      const startDate = startDateTime.toISOString()
      const endDate = endDateTime.toISOString()

      const { error } = await supabase
        .from("batches")
        .update({
          batch_name: values.batchName,
          start_date: startDate,
          end_date: endDate,
          start_time: values.startTime,
          end_time: values.endTime,
          selected_dates: values.selectedDates.map((d) => d.toISOString()),
          instructor: values.instructor,
          location: values.location,
          zoom_link: values.zoomLink || null,
          zoom_id: values.zoomId || null,
          zoom_password: values.zoomPassword || null,
          status: values.status,
        })
        .eq("id", params?.id)

      if (error) throw error

      toast({
        title: "Batch Updated",
        description: "The batch has been updated successfully.",
      })
      router.push(`/batches/${params?.id}`)
    } catch (error) {
      console.error("Error updating batch:", error)
      toast({
        title: "Error",
        description: "Failed to update batch. Please try again.",
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Batch</h1>
          <p className="text-muted-foreground">Update batch details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batch Details</CardTitle>
          <CardDescription>Edit the details for this batch</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Loading batch data...</p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="batchName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Batch #4" {...field} />
                        </FormControl>
                        <FormDescription>A unique name for this batch.</FormDescription>
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
                        <FormDescription>The primary instructor for this batch.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={"w-full justify-start text-left font-normal"}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  field.value.toLocaleDateString()
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>The start date of the batch.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormDescription>The start time of sessions.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={"w-full justify-start text-left font-normal"}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  field.value.toLocaleDateString()
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>The end date of the batch.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormDescription>The end time of sessions.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="selectedDates"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Select Dates</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={field.value && field.value.length > 0 ? "default" : "outline"}
                              className="w-full justify-start text-left font-normal"
                              type="button"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value && field.value.length > 0
                                ? field.value.map((date: Date) => date.toLocaleDateString()).join(", ")
                                : <span>Select dates</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="multiple" selected={field.value} onSelect={field.onChange} numberOfMonths={2} />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>Select one or more dates for this batch.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Room 101, STEI Building" {...field} />
                        </FormControl>
                        <FormDescription>The physical location where the batch will be conducted.</FormDescription>
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
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>Current status of the batch.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zoomLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zoom Meeting Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://zoom.us/j/123456789" {...field} />
                        </FormControl>
                        <FormDescription>The URL for joining the Zoom meeting.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zoomId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zoom Meeting ID</FormLabel>
                        <FormControl>
                          <Input placeholder="123 456 7890" {...field} />
                        </FormControl>
                        <FormDescription>The ID for the Zoom meeting.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zoomPassword"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Zoom Meeting Password</FormLabel>
                        <FormControl>
                          <Input placeholder="abc123" {...field} />
                        </FormControl>
                        <FormDescription>The password for the Zoom meeting.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => router.push(`/batches/${params?.id}`)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Batch"
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