"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Mail, Plus, Users, Loader2 } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export default function BatchDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()

  const [batch, setBatch] = useState<any>(null)
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddSessionDialogOpen, setIsAddSessionDialogOpen] = useState(false)

  useEffect(() => {
    if (params?.id) {
      fetchBatchData()
    }
  }, [params?.id])

  const fetchBatchData = async () => {
    setIsLoading(true)
    try {
      // Fetch the specific batch with workshop details
      const { data: batchData, error: batchError } = await supabase
        .from("batches")
        .select(`
        id,
        batch_name,
        start_date,
        end_date,
        selected_dates,
        location,
        instructor,
        status,
        zoom_link,
        zoom_id,
        zoom_password,
        workshop_id,
        workshops (
          id,
          name,
          capacity
        )
      `)
        .eq("id", params?.id)
        .single()

      if (batchError) throw batchError

      // Fetch students enrolled in this batch
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select(`
        id,
        enrollment_date,
        payment_status,
        student_id,
        students (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
        .eq("batch_id", params?.id)
        .order("enrollment_date", { ascending: false })

      if (enrollmentsError) throw enrollmentsError

      // Format the batch data
      const formattedBatch = {
        id: batchData.id,
        name: batchData.batch_name,
        workshop: batchData.workshops?.[0]?.name || "Unknown Workshop",
        workshopId: batchData.workshop_id,
        startDate: batchData.start_date,
        endDate: batchData.end_date,
        selected_dates: batchData.selected_dates || [],
        instructor: batchData.instructor,
        location: batchData.location,
        status: batchData.status,
        students: `${enrollmentsData.length}/${batchData.workshops?.[0]?.capacity || 0}`,
        zoomLink: batchData.zoom_link,
        zoomId: batchData.zoom_id,
        zoomPassword: batchData.zoom_password,
        capacity: batchData.workshops?.[0]?.capacity || 0,
      }

      // Format the students data
      const formattedStudents = enrollmentsData.map((enrollment) => ({
        id: enrollment.student_id,
        name: `${enrollment.students?.[0]?.first_name || ""} ${enrollment.students?.[0]?.last_name || ""}`,
        email: enrollment.students?.[0]?.email || "",
        phone: enrollment.students?.[0]?.phone || "",
        joinedDate: enrollment.enrollment_date,
        paymentStatus: enrollment.payment_status,
      }))

      setBatch(formattedBatch)
      setEnrolledStudents(formattedStudents)
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

  const formatSelectedDates = (dates: string[]) => {
    if (!dates || dates.length === 0) {
      return "No dates selected"
    }
    
    const formattedDates = dates.map(date => {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    })
    
    if (formattedDates.length === 1) {
      return formattedDates[0]
    } else if (formattedDates.length === 2) {
      return `${formattedDates[0]} and ${formattedDates[1]}`
    } else {
      return `${formattedDates[0]}, ${formattedDates[1]}, and ${formattedDates.length - 2} more`
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading batch details...</p>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <p className="text-lg mb-4">Batch not found</p>
        <Button onClick={() => router.push("/batches")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Batches
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
          <h1 className="text-3xl font-bold tracking-tight">
            {batch?.workshop} - {batch?.name}
          </h1>
          <p className="text-muted-foreground">Batch details and management</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Batch Information</CardTitle>
            <CardDescription>Basic details about this batch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Workshop</h3>
                <p>
                  <Link href={`/workshops/${batch.workshopId}`} className="text-primary hover:underline">
                    {batch.workshop}
                  </Link>
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Start Date</h3>
                <p>{formatDate(batch.startDate)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">End Date</h3>
                <p>{formatDate(batch.endDate)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Selected Dates</h3>
                <p>{formatSelectedDates(batch.selected_dates)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                <p>{batch.location}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Instructor</h3>
                <p>{batch.instructor}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <Badge
                  className={
                    batch.status === "active"
                      ? "bg-green-500"
                      : batch.status === "upcoming"
                        ? "bg-yellow-500"
                        : batch.status === "completed"
                          ? "bg-blue-500"
                          : "bg-gray-500"
                  }
                >
                  {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                </Badge>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Students</h3>
                <p>{batch.students}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Zoom Meeting</h3>
                {batch.zoomLink ? (
                  <div className="mt-1 space-y-1">
                    <p>
                      <a
                        href={batch.zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Join Zoom Meeting
                      </a>
                    </p>
                    <p className="text-sm">Meeting ID: {batch.zoomId}</p>
                    <p className="text-sm">Password: {batch.zoomPassword}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No Zoom meeting configured</p>
                )}
              </div>
              <div className="pt-4">
                <Link href={`/batches/${batch.id}/edit`}>
                  <Button className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Batch
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-0">
            <Tabs defaultValue="students" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
              </TabsList>
              <TabsContent value="students" className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">
                    Enrolled Students ({enrolledStudents.length}/{batch?.capacity || 0})
                  </h3>
                  <div className="flex gap-2">
                    <Link href={`/students/new?batch=${batch?.id}`}>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Student
                      </Button>
                    </Link>
                    <Link href={`/email/send?batch=${batch?.id}`}>
                      <Button size="sm" variant="outline">
                        <Mail className="mr-2 h-4 w-4" />
                        Email All
                      </Button>
                    </Link>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrolledStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No students enrolled in this batch yet.
                          <Link href={`/students/new?batch=${batch?.id}`} className="ml-1 text-primary hover:underline">
                            Add your first student
                          </Link>
                        </TableCell>
                      </TableRow>
                    ) : (
                      enrolledStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.phone}</TableCell>
                          <TableCell>{formatDate(student.joinedDate)}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                student.paymentStatus === "completed"
                                  ? "bg-green-500"
                                  : student.paymentStatus === "partial"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }
                            >
                              {student.paymentStatus.charAt(0).toUpperCase() + student.paymentStatus.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Link href={`/students/${student.id}`}>
                                <Button size="sm" variant="ghost">
                                  <Users className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              </Link>
                              <Link href={`/email/send?to=${student.email}`}>
                                <Button size="sm" variant="ghost">
                                  <Mail className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="sessions" className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Batch Sessions</h3>
                  <Dialog open={isAddSessionDialogOpen} onOpenChange={setIsAddSessionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Session
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Add New Session</DialogTitle>
                        <DialogDescription>
                          Create a new session for this batch. Fill in the details below.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="session-date">Date</Label>
                            <Input id="session-date" type="date" className="col-span-3" />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="session-time">Time</Label>
                            <div className="flex gap-2">
                              <Input id="session-time-start" type="time" placeholder="Start" />
                              <span className="flex items-center">-</span>
                              <Input id="session-time-end" type="time" placeholder="End" />
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="session-topic">Topic</Label>
                          <Input id="session-topic" placeholder="e.g., Introduction to React" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="session-instructor">Instructor</Label>
                          <Input id="session-instructor" placeholder="e.g., John Doe" defaultValue={batch.instructor} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="session-description">Description</Label>
                          <Textarea
                            id="session-description"
                            placeholder="Brief description of what will be covered in this session"
                            className="min-h-[100px]"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="session-status">Status</Label>
                          <Select defaultValue="upcoming">
                            <SelectTrigger id="session-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="upcoming">Upcoming</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddSessionDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            toast({
                              title: "Session Added",
                              description: "The session has been added successfully.",
                            })
                            setIsAddSessionDialogOpen(false)
                          }}
                        >
                          Add Session
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No sessions found for this batch.
                        <Button
                          variant="link"
                          className="px-2 py-0 h-auto"
                          onClick={() => setIsAddSessionDialogOpen(true)}
                        >
                          Add your first session
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardContent>{/* Remove content from here as it's now inside the Tabs component */}</CardContent>
        </Card>
      </div>
    </div>
  )
}
