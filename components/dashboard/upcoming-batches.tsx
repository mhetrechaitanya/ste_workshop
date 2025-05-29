"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

interface Batch {
  id: string
  batch_name: string
  start_date: string
  workshop_name: string
  capacity: number
  student_count: number
}

export function UpcomingBatches() {
  const router = useRouter()
  const { toast } = useToast()
  const [batches, setBatches] = useState<Batch[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUpcomingBatches()
  }, [])

  // Update the fetchUpcomingBatches function to not use mock data
  const fetchUpcomingBatches = async () => {
    try {
      // Get current date
      const today = new Date().toISOString().split("T")[0]

      // Fetch upcoming batches
      const { data, error } = await supabase
        .from("batches")
        .select(`
      id,
      batch_name,
      start_date,
      workshop_id,
      workshops (
        id,
        name,
        capacity
      )
    `)
        .gte("start_date", today)
        .order("start_date", { ascending: true })
        .limit(5)

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
            start_date: batch.start_date,
            workshop_name: batch.workshops.name,
            capacity: batch.workshops.capacity,
            student_count: count || 0,
          }
        }),
      )

      setBatches(batchesWithStudentCounts)
    } catch (error) {
      console.error("Error fetching upcoming batches:", error)
      toast({
        title: "Error",
        description: "Failed to load upcoming batches. Please try again.",
        variant: "destructive",
      })

      // Set empty array instead of mock data
      setBatches([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewBatch = (id: string) => {
    router.push(`/batches/${id}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <Card className="w-full border-none shadow-md overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">Upcoming Batches</CardTitle>
          <CardDescription>Batches starting soon</CardDescription>
        </div>
        <Link href="/batches">
          <Button variant="outline" size="sm" className="hover:bg-gray-500/5 hover:text-gray-500 transition-colors">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-transparent border-b">
              <TableRow>
                <TableHead>Workshop</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2">Loading batches...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No upcoming batches found.
                    <Link href="/batches/new" className="ml-1 text-primary hover:underline">
                      Add your first batch
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((batch) => (
                  <TableRow key={batch.id} className="hover:bg-white/50 dark:hover:bg-black/50 transition-colors">
                    <TableCell className="font-medium">{batch.workshop_name}</TableCell>
                    <TableCell>{batch.batch_name}</TableCell>
                    <TableCell>{formatDate(batch.start_date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-100 rounded-full h-2.5 dark:bg-gray-700 mr-2">
                          <div
                            className="bg-gray-500 h-2.5 rounded-full"
                            style={{ width: `${Math.min(100, (batch.student_count / batch.capacity) * 100)}%` }}
                          ></div>
                        </div>
                        <span>
                          {batch.student_count}/{batch.capacity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hover:bg-gray-500/5 hover:text-gray-500 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewBatch(batch.id)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
