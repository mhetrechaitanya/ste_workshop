"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, Plus, Search, Edit, Trash, Loader2 } from "lucide-react"
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
import { supabase } from "@/lib/supabase"

interface Workshop {
  id: string
  name: string
  category_id: number
  category_name?: string
  selected_dates: string[]
  fee: number
  status: string
  batches_count?: number
  description: string
}

export default function WorkshopsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkshops()
  }, [])

  const fetchWorkshops = async () => {
    setIsLoading(true)
    try {
      /* Fetch workshops with category names */
      const { data: workshopsData, error: workshopsError } = await supabase
        .from("workshops")
        .select(`
        *,
        categories(name)
      `)
        .order("created_at", { ascending: false })

      if (workshopsError) throw workshopsError

      /* For each workshop, count the number of batches */
      const workshopsWithBatchCounts = await Promise.all(
        workshopsData.map(async (workshop) => {
          const { count, error } = await supabase
            .from("batches")
            .select("*", { count: "exact", head: true })
            .eq("workshop_id", workshop.id)

          return {
            ...workshop,
            category_name: workshop.categories?.name || "Unknown",
            batches_count: count || 0,
          }
        }),
      )

      setWorkshops(workshopsWithBatchCounts)
    } catch (error) {
      console.error("Error fetching workshops:", error)
      toast({
        title: "Error",
        description: "Failed to load workshops. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      fetchWorkshops()
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("workshops")
        .select(`
        *,
        categories(name)
      `)
        .ilike("name", `%${searchQuery}%`)
        .order("created_at", { ascending: false })

      if (error) throw error

      /* For each workshop, count the number of batches */
      const workshopsWithBatchCounts = await Promise.all(
        data.map(async (workshop) => {
          const { count, error } = await supabase
            .from("batches")
            .select("*", { count: "exact", head: true })
            .eq("workshop_id", workshop.id)

          return {
            ...workshop,
            category_name: workshop.categories?.name || "Unknown",
            batches_count: count || 0,
          }
        }),
      )

      setWorkshops(workshopsWithBatchCounts)
      toast({
        title: "Search Results",
        description: `Found ${data.length} workshops matching "${searchQuery}"`,
      })
    } catch (error) {
      console.error("Error searching workshops:", error)
      toast({
        title: "Error",
        description: "Failed to search workshops. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      const { error } = await supabase.from("workshops").delete().eq("id", id)

      if (error) throw error

      setWorkshops(workshops.filter((workshop) => workshop.id !== id))
      toast({
        title: "Workshop Deleted",
        description: "The workshop has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting workshop:", error)
      toast({
        title: "Error",
        description: "Failed to delete workshop. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workshops</h1>
          <p className="text-muted-foreground">Manage your workshop offerings</p>
        </div>
        <div className="flex gap-2">
          <Link href="/workshops/categories">
            <Button variant="outline">Manage Categories</Button>
          </Link>
          <Link href="/workshops/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Workshop
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col space-y-4">
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>All Workshops</CardTitle>
              <CardDescription>View and manage all your workshops</CardDescription>
            </div>
            <form onSubmit={handleSearch} className="flex items-center space-x-2">
              <Input
                type="search"
                placeholder="Search workshops..."
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
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Batches</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2">Loading workshops...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : workshops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No workshops found.
                      <Link href="/workshops/new" className="ml-1 text-primary hover:underline">
                        Add your first workshop
                      </Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  workshops.map((workshop) => (
                    <TableRow key={workshop.id}>
                      <TableCell className="font-medium">{workshop.name}</TableCell>
                      <TableCell>{workshop.category_name}</TableCell>
                      <TableCell>{formatSelectedDates(workshop.selected_dates)}</TableCell>
                      <TableCell>{formatCurrency(workshop.fee)}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>{workshop.batches_count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/workshops/${workshop.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </Link>
                          <Link href={`/workshops/${workshop.id}/edit`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
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
                                  This will permanently delete the workshop and all associated data. This action cannot
                                  be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={() => handleDelete(workshop.id)}
                                  disabled={isDeleting === workshop.id}
                                >
                                  {isDeleting === workshop.id ? (
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
