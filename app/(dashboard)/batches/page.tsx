"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, Plus, Search, Trash, Loader2 } from "lucide-react"
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
import { supabase } from "@/lib/supabase"

interface Batch {
  id: string
  batch_name: string
  workshop_name: string
  start_date: string
  end_date: string
  student_count: number
  capacity: number
  status: string
}

export default function BatchesPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [batches, setBatches] = useState<Batch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchBatches()
  }, [])

  const fetchBatches = async () => {
    setIsLoading(true)
    try {
      // Fetch batches with workshop details
      const { data: batchesData, error: batchesError } = await supabase
        .from("batches")
        .select(`
          id,
          batch_name,
          start_date,
          end_date,
          status,
          workshop_id,
          workshops (
            id,
            name,
            capacity
          )
        `)
        .order("start_date", { ascending: false })

      if (batchesError) throw batchesError

      // For each batch, count the number of enrolled students
      const batchesWithStudentCounts = await Promise.all(
        batchesData.map(async (batch) => {
          const { count, error } = await supabase
            .from("enrollments")
            .select("*", { count: "exact", head: true })
            .eq("batch_id", batch.id)

          return {
            id: batch.id,
            batch_name: batch.batch_name,
            workshop_name: batch.workshops.name,
            start_date: batch.start_date,
            end_date: batch.end_date,
            student_count: count || 0,
            capacity: batch.workshops.capacity,
            status: batch.status,
          }
        }),
      )

      setBatches(batchesWithStudentCounts)
    } catch (error) {
      console.error("Error fetching batches:", error)
      toast({
        title: "Error",
        description: "Failed to load batches. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      fetchBatches()
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("batches")
        .select(`
          id,
          batch_name,
          start_date,
          end_date,
          status,
          workshop_id,
          workshops (
            id,
            name,
            capacity
          )
        `)
        .or(`batch_name.ilike.%${searchQuery}%,workshops.name.ilike.%${searchQuery}%`)
        .order("start_date", { ascending: false })

      if (error) throw error

      // For each batch, count the number of enrolled students
      const batchesWithStudentCounts = await Promise.all(
        data.map(async (batch) => {
          const { count, error } = await supabase
            .from("enrollments")
            .select("*", { count: "exact", head: true })
            .eq("batch_id", batch.id)

          return {
            id: batch.id,
            batch_name: batch.batch_name,
            workshop_name: batch.workshops.name,
            start_date: batch.start_date,
            end_date: batch.end_date,
            student_count: count || 0,
            capacity: batch.workshops.capacity,
            status: batch.status,
          }
        }),
      )

      setBatches(batchesWithStudentCounts)
      toast({
        title: "Search Results",
        description: `Found ${data.length} batches matching "${searchQuery}"`,
      })
    } catch (error) {
      console.error("Error searching batches:", error)
      toast({
        title: "Error",
        description: "Failed to search batches. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      const { error } = await supabase.from("batches").delete().eq("id", id)

      if (error) throw error

      setBatches(batches.filter((batch) => batch.id !== id))
      toast({
        title: "Batch Deleted",
        description: "The batch has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting batch:", error)
      toast({
        title: "Error",
        description: "Failed to delete batch. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Batches</h1>
          <p className="text-muted-foreground">Manage your workshop batches</p>
        </div>
        <Link href="/batches/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Batch
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-col space-y-4">
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>All Batches</CardTitle>
              <CardDescription>View and manage all your workshop batches</CardDescription>
            </div>
            <form onSubmit={handleSearch} className="flex items-center space-x-2">
              <Input
                type="search"
                placeholder="Search batches..."
                className="h-9 w-[200px] md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" size="sm" className="h-9">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workshop</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-3 text-primary" />
                        <span>Loading batches...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : batches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No batches found.
                      <Link href="/batches/new" className="text-primary hover:underline ml-1">
                        Add your first batch
                      </Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.workshop_name}</TableCell>
                      <TableCell>{batch.batch_name}</TableCell>
                      <TableCell>{formatDate(batch.start_date)}</TableCell>
                      <TableCell>{formatDate(batch.end_date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-full bg-blue-100 rounded-full h-2.5 dark:bg-blue-900 mr-2">
                            <div
                              className="bg-blue-500 h-2.5 rounded-full"
                              style={{ width: `${Math.min(100, (batch.student_count / batch.capacity) * 100)}%` }}
                            ></div>
                          </div>
                          <span>
                            {batch.student_count}/{batch.capacity}
                          </span>
                        </div>
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
                        <div className="flex items-center gap-2">
                          <Link href={`/batches/${batch.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
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
                                  This will permanently delete the batch and all associated data. This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={() => handleDelete(batch.id)}
                                  disabled={isDeleting === batch.id}
                                >
                                  {isDeleting === batch.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    "Delete"
                                  )}
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
