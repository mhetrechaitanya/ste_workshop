"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, Mail, Search, Trash, Loader2 } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

export default function StudentsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  // Add a new state for the status filter
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      // Fetch students from Supabase
      const { data, error } = await supabase.from("students").select("*").order("created_at", { ascending: false })

      if (error) throw error

      // For each student, count the number of workshops they're enrolled in
      const studentsWithWorkshopCounts = await Promise.all(
        data.map(async (student) => {
          const { count, error } = await supabase
            .from("enrollments")
            .select("*", { count: "exact", head: true })
            .eq("student_id", student.id)

          return {
            id: student.id,
            name: `${student.first_name} ${student.last_name}`,
            email: student.email,
            phone: student.phone,
            workshops: count || 0,
            status: student.status || "active",
          }
        }),
      )

      setStudents(studentsWithWorkshopCounts)
    } catch (error) {
      console.error("Error fetching students:", error)
      toast({
        title: "Error",
        description: "Failed to load students. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      fetchStudents()
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .order("created_at", { ascending: false })

      if (error) throw error

      // For each student, count the number of workshops they're enrolled in
      const studentsWithWorkshopCounts = await Promise.all(
        data.map(async (student) => {
          const { count, error } = await supabase
            .from("enrollments")
            .select("*", { count: "exact", head: true })
            .eq("student_id", student.id)

          return {
            id: student.id,
            name: `${student.first_name} ${student.last_name}`,
            email: student.email,
            phone: student.phone,
            workshops: count || 0,
            status: student.status || "active",
          }
        }),
      )

      setStudents(studentsWithWorkshopCounts)
      toast({
        title: "Search Results",
        description: `Found ${data.length} students matching "${searchQuery}"`,
      })
    } catch (error) {
      console.error("Error searching students:", error)
      toast({
        title: "Error",
        description: "Failed to search students. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("students").delete().eq("id", id)

      if (error) throw error

      setStudents(students.filter((student) => student.id !== id))
      toast({
        title: "Student Deleted",
        description: "The student has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting student:", error)
      toast({
        title: "Error",
        description: "Failed to delete student. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Add a function to filter students by status
  const filteredStudents = students.filter((student) => {
    if (statusFilter === "all") return true
    return student.status === statusFilter
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">Manage your student records</p>
        </div>
        {/* Add Student button removed */}
      </div>

      <Card>
        <CardHeader className="flex flex-col space-y-4">
          {/* Replace the existing search form with this updated version: */}
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>All Students</CardTitle>
              <CardDescription>View and manage all your students</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <form onSubmit={handleSearch} className="flex items-center space-x-2">
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="h-9 w-[200px] md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" size="sm" className="h-9">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Workshops</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              {/* Finally, update the table body to use filteredStudents instead of students */}
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2">Loading students...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No students found.
                      <Link href="/students/new" className="ml-1 text-primary hover:underline">
                        Add your first student
                      </Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell>{student.workshops}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            student.status === "active"
                              ? "bg-green-500"
                              : student.status === "pending"
                                ? "bg-yellow-500"
                                : "bg-gray-500"
                          }
                        >
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/students/${student.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </Link>
                          <Link href={`/email/send?to=${student.email}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Mail className="h-4 w-4" />
                              <span className="sr-only">Email</span>
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the student and all associated data. This action cannot
                                  be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={() => handleDelete(student.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
