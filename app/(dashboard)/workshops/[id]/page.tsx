"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Edit, Loader2, Plus, Users } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

// Import Image component
import Image from "next/image"

// Update the Workshop interface to include selected_dates
interface Workshop {
  id: string
  name: string
  category_id: number
  category_name?: string
  description: string
  selected_dates: string[]
  fee: number
  capacity: number
  instructor: string
  status: string
  created_at: string
  image: string | null
}

interface Batch {
  id: string
  batch_name: string
  start_date: string
  end_date: string
  status: string
  student_count: number
}

interface Student {
  id: string
  first_name: string
  last_name: string
  joined_date: string
  payment_status: string
}

export default function WorkshopDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [workshop, setWorkshop] = useState<Workshop | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("description")

  useEffect(() => {
    fetchWorkshopData()
  }, [params.id])

  const fetchWorkshopData = async () => {
    setIsLoading(true)
    try {
      /* Fetch workshop details with category name */
      const { data: workshopData, error: workshopError } = await supabase
        .from("workshops")
        .select(`
        *,
        categories(name)
      `)
        .eq("id", params.id)
        .single()

      if (workshopError) throw workshopError

      /* Add category_name to the workshop data */
      const workshopWithCategoryName = {
        ...workshopData,
        category_name: workshopData.categories?.name || "Unknown",
      }

      setWorkshop(workshopWithCategoryName)

      /* Fetch batches for this workshop */
      const { data: batchesData, error: batchesError } = await supabase
        .from("batches")
        .select("id, batch_name, start_date, end_date, status")
        .eq("workshop_id", params.id)
        .order("start_date", { ascending: false })

      if (batchesError) throw batchesError

      /* For each batch, count the number of students */
      const batchesWithStudentCounts = await Promise.all(
        batchesData.map(async (batch) => {
          const { count, error } = await supabase
            .from("enrollments")
            .select("*", { count: "exact", head: true })
            .eq("batch_id", batch.id)

          return {
            ...batch,
            student_count: count || 0,
          }
        }),
      )

      setBatches(batchesWithStudentCounts)

      /* Fetch students enrolled in any batch of this workshop */
      if (batchesData.length > 0) {
        const batchIds = batchesData.map((batch) => batch.id)

        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from("enrollments")
          .select(`
            id,
            enrollment_date,
            payment_status,
            student_id,
            students(id, first_name, last_name)
          `)
          .in("batch_id", batchIds)
          .order("enrollment_date", { ascending: false })
          .limit(10)

        if (enrollmentsError) throw enrollmentsError

        const studentsData = enrollmentsData.map((enrollment) => ({
          id: enrollment.students[0].id,
          first_name: enrollment.students[0].first_name,
          last_name: enrollment.students[0].last_name,
          joined_date: enrollment.enrollment_date,
          payment_status: enrollment.payment_status,
        }))

        setStudents(studentsData)
      }
    } catch (error) {
      console.error("Error fetching workshop data:", error)
      toast({
        title: "Error",
        description: "Failed to load workshop details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading workshop details...</p>
      </div>
    )
  }

  if (!workshop) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <p className="text-lg mb-4">Workshop not found</p>
        <Button onClick={() => router.push("/workshops")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workshops
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
          <h1 className="text-3xl font-bold tracking-tight">{workshop.name}</h1>
          <p className="text-muted-foreground">Workshop details and management</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Workshop Information</CardTitle>
            <CardDescription>Basic details about this workshop</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                <p>{workshop.category_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Selected Dates</h3>
                <p>{formatSelectedDates(workshop.selected_dates)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Fee</h3>
                <p>{formatCurrency(workshop.fee)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Capacity</h3>
                <p>{workshop.capacity} students per batch</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Primary Instructor</h3>
                <p>{workshop.instructor}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <Badge
                  className={
                    workshop.status === "active"
                      ? "bg-green-500"
                      : workshop.status === "upcoming"
                        ? "bg-yellow-500"
                        : workshop.status === "completed"
                          ? "bg-blue-500"
                          : "bg-gray-500"
                  }
                >
                  {workshop.status.charAt(0).toUpperCase() + workshop.status.slice(1)}
                </Badge>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Created On</h3>
                <p>{formatDate(workshop.created_at)}</p>
              </div>
              {workshop.image && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Workshop Image</h3>
                  <div className="mt-2 relative aspect-video w-full overflow-hidden rounded-md border border-border">
                    <Image
                      src={workshop.image || "/placeholder.svg"}
                      alt={workshop.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  </div>
                </div>
              )}
              <div className="pt-4">
                <Link href={`/workshops/${workshop.id}/edit`}>
                  <Button className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Workshop
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="batches">Batches</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Workshop Description</h3>
                  <p>{workshop.description}</p>
                </div>
              </TabsContent>
              <TabsContent value="batches" className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Workshop Batches</h3>
                  <Link href={`/batches/new?workshop=${workshop.id}`}>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Batch
                    </Button>
                  </Link>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No batches found for this workshop.
                          <Link
                            href={`/batches/new?workshop=${workshop.id}`}
                            className="ml-1 text-primary hover:underline"
                          >
                            Add your first batch
                          </Link>
                        </TableCell>
                      </TableRow>
                    ) : (
                      batches.map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">{batch.batch_name}</TableCell>
                          <TableCell>{formatDate(batch.start_date)}</TableCell>
                          <TableCell>{formatDate(batch.end_date)}</TableCell>
                          <TableCell>
                            {batch.student_count}/{workshop.capacity}
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell>
                            <Link href={`/batches/${batch.id}`}>
                              <Button size="sm" variant="ghost">
                                <Calendar className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="students" className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Enrolled Students</h3>
                  <Link href={`/students/new?workshop=${workshop.id}`}>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Student
                    </Button>
                  </Link>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No students enrolled in this workshop yet.
                          <Link
                            href={`/students/new?workshop=${workshop.id}`}
                            className="ml-1 text-primary hover:underline"
                          >
                            Add your first student
                          </Link>
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.first_name} {student.last_name}
                          </TableCell>
                          <TableCell>{formatDate(student.joined_date)}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                student.payment_status === "completed"
                                  ? "bg-green-500"
                                  : student.payment_status === "partial"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }
                            >
                              {student.payment_status.charAt(0).toUpperCase() + student.payment_status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Link href={`/students/${student.id}`}>
                              <Button size="sm" variant="ghost">
                                <Users className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardContent>{/* Content is inside the Tabs component */}</CardContent>
        </Card>
      </div>
    </div>
  )
}
