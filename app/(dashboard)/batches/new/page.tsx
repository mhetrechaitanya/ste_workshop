"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Separator } from "@/components/ui/separator"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { Link } from "@/components/ui/link"

// Import zod resolver from a compatible package
import { zodResolver } from "@hookform/resolvers/zod"

const batchSchema = z.object({
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
  schedule: z.string().min(2, {
    message: "Schedule is required.",
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

const formSchema = z.object({
  workshop: z.string({
    required_error: "Please select a workshop.",
  }),
  batches: z.array(batchSchema).min(1, {
    message: "At least one batch is required.",
  }),
})

interface Workshop {
  id: string
  name: string
}

export default function NewBatchPage() {
  const { toast } = useToast()
  const router = useRouter()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [isLoadingWorkshops, setIsLoadingWorkshops] = useState(true)

  // Get today's date for default values
  const today = new Date()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workshop: "",
      batches: [
        {
          batchName: "",
          startDate: today,
          endDate: today,
          schedule: "",
          instructor: "",
          location: "",
          zoomLink: "",
          zoomId: "",
          zoomPassword: "",
          startTime: "09:00",
          endTime: "11:00",
          status: "upcoming",
        },
      ],
    },
  })

  const { control, handleSubmit } = form

  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        setIsLoadingWorkshops(true);
        const { data, error } = await supabase.from("workshops").select("id, name").order("name", { ascending: true })

        if (error) throw error
        setWorkshops(data || [])
        console.log("Fetched workshops:", data)
      } catch (error) {
        console.error("Error fetching workshops:", error)
        toast({
          title: "Error",
          description: "Failed to load workshops. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingWorkshops(false)
      }
    }

    fetchWorkshops()
  }, [toast])

  const { fields, append, remove } = useFieldArray({
    control,
    name: "batches",
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      // Create batches one by one
      const createdBatches = []

      for (const batch of values.batches) {
        // Combine date and time for start and end dates
        const startDateTime = new Date(batch.startDate)
        const [startHours, startMinutes] = batch.startTime.split(":").map(Number)
        startDateTime.setHours(startHours, startMinutes, 0)

        const endDateTime = new Date(batch.endDate)
        const [endHours, endMinutes] = batch.endTime.split(":").map(Number)
        endDateTime.setHours(endHours, endMinutes, 0)

        // Format dates for database
        const startDate = startDateTime.toISOString()
        const endDate = endDateTime.toISOString()

        // Insert batch into database
        const { data, error } = await supabase
          .from("batches")
          .insert({
            batch_name: batch.batchName,
            workshop_id: values.workshop ? parseInt(values.workshop, 10) : null,
            start_date: startDate,
            end_date: endDate,
            start_time: batch.startTime,
            end_time: batch.endTime,
            schedule: batch.schedule,
            instructor: batch.instructor,
            location: batch.location,
            zoom_link: batch.zoomLink || null,
            zoom_id: batch.zoomId || null,
            zoom_password: batch.zoomPassword || null,
            status: batch.status,
          })
          .select()

        if (error) {
          throw new Error(`Failed to create batch: ${error.message}`)
        }

        createdBatches.push(data[0])
      }

      toast({
        title: "Batches Created",
        description: `Successfully created ${values.batches.length} batch(es).`,
      })

      // Navigate to batches page after successful creation
      router.push("/batches")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create batches. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function addBatch() {
    append({
      batchName: "",
      startDate: new Date(),
      endDate: new Date(),
      schedule: "",
      instructor: "",
      location: "",
      zoomLink: "",
      zoomId: "",
      zoomPassword: "",
      startTime: "09:00",
      endTime: "11:00",
      status: "upcoming",
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Batch</h1>
        <p className="text-muted-foreground">Create one or more workshop batches</p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workshop Selection</CardTitle>
              <CardDescription>Select the workshop for these batches</CardDescription>
            </CardHeader>
            <CardContent>
            <FormField
  control={control}
  name="workshop"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Workshop</FormLabel>
      <Select
        onValueChange={(value) => {
          // Safely handle the workshop change
          // Wrap in setTimeout to avoid React re-rendering issues
          setTimeout(() => {
            console.log("Selected workshop:", value);
            field.onChange(value);
            
            // If you have any other form fields that need to be updated or reset
            // // based on workshop selection, do it here AFTER the onChange
            // if (resetDependentFields) {
            //   resetDependentFields(value);
            // }
          }, 0);
        }}
        value={field.value || ""}  // Ensure value is never undefined
        disabled={isLoadingWorkshops}
      >
        <FormControl>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={
              isLoadingWorkshops 
                ? "Loading workshops..." 
                : "Select a workshop"
            }>
              {field.value
                ? workshops.find((w) => w.id === field.value)?.name
                : null}
            </SelectValue>
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {isLoadingWorkshops ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Loading workshops...</span>
            </div>
          ) : workshops.length === 0 ? (
            <div className="p-2 text-center">
              <p className="text-sm text-muted-foreground">No workshops found.</p>
              <Link href="/workshops/new" className="text-xs text-primary hover:underline">
                Add your first workshop
              </Link>
            </div>
          ) : (
            workshops.map((workshop) => (
              <SelectItem 
                key={workshop.id} 
                value={workshop.id}
              >
                {workshop.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <FormDescription>Select the workshop for this batch.</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>

            </CardContent>
          </Card>

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Batch {index + 1} Details</CardTitle>
                  <CardDescription>Enter the details for this batch</CardDescription>
                </div>
                {index > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={control}
                    name={`batches.${index}.batchName`}
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
                    control={control}
                    name={`batches.${index}.instructor`}
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
                    control={control}
                    name={`batches.${index}.startDate`}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={"w-full justify-start text-left font-normal"}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>The start date of the batch.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`batches.${index}.startTime`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <div className="flex items-center">
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                        </div>
                        <FormDescription>The start time of sessions.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`batches.${index}.endDate`}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={"w-full justify-start text-left font-normal"}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>The end date of the batch.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`batches.${index}.endTime`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <div className="flex items-center">
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                        </div>
                        <FormDescription>The end time of sessions.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`batches.${index}.schedule`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule</FormLabel>
                        <FormControl>
                          <Input placeholder="Mon, Wed, Fri" {...field} />
                        </FormControl>
                        <FormDescription>The days of the week for this batch.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`batches.${index}.location`}
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
                    control={control}
                    name={`batches.${index}.status`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            console.log(`Setting status for batch ${index} to:`, value);
                            field.onChange(value);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue>
                                {field.value === "upcoming" && "Upcoming"}
                                {field.value === "active" && "Active"}
                                {field.value === "completed" && "Completed"}
                                {field.value === "cancelled" && "Cancelled"}
                                {!field.value && "Select status"}
                              </SelectValue>
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
                </div>

                <Separator className="my-6" />

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Zoom Meeting Details</h3>
                  <p className="text-sm text-muted-foreground">Add Zoom meeting details for online sessions</p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-4">
                  <FormField
                    control={control}
                    name={`batches.${index}.zoomLink`}
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
                    control={control}
                    name={`batches.${index}.zoomId`}
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
                    control={control}
                    name={`batches.${index}.zoomPassword`}
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
              </CardContent>
            </Card>
          ))}

          <Button type="button" variant="outline" onClick={addBatch} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Another Batch
          </Button>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => router.push("/batches")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Batches"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}