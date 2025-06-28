"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

interface Workshop {
  id: string
  name: string
  category: string
  selected_dates: string[]
  status: string
}

export function RecentWorkshops() {
  const router = useRouter()
  const { toast } = useToast()
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRecentWorkshops()
  }, [])

  // Update the fetchRecentWorkshops function to not use mock data
  const fetchRecentWorkshops = async () => {
    try {
      const { data, error } = await supabase
        .from("workshops")
        .select(`
      id,
      name,
      selected_dates,
      status,
      category_id,
      categories(name)
    `)
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) throw error

      const formattedWorkshops = data.map((workshop) => ({
        id: workshop.id,
        name: workshop.name,
        category: workshop.categories?.[0]?.name || "Uncategorized",
        selected_dates: workshop.selected_dates || [],
        status: workshop.status,
      }))

      setWorkshops(formattedWorkshops)
    } catch (error) {
      console.error("Error fetching recent workshops:", error)
      toast({
        title: "Error",
        description: "Failed to load recent workshops. Please try again.",
        variant: "destructive",
      })

      // Set empty array instead of mock data
      setWorkshops([])
    } finally {
      setIsLoading(false)
    }
  }

  // Update the handleViewWorkshop function to navigate to the workshop details page
  const handleViewWorkshop = (id: string) => {
    router.push(`/workshops/${id}`)
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
    <Card className="w-full border-none shadow-md overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">Recent Workshops</CardTitle>
          <CardDescription>Recently added or updated workshops</CardDescription>
        </div>
        <Link href="/workshops">
          <Button variant="outline" size="sm" className="hover:bg-stei-red/5 hover:text-stei-red transition-colors">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-transparent border-b">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Selected Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2">Loading workshops...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : workshops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No workshops found.
                    <Link href="/workshops/new" className="ml-1 text-primary hover:underline">
                      Add your first workshop
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                workshops.map((workshop) => (
                  <TableRow key={workshop.id} className="hover:bg-white/50 dark:hover:bg-black/50 transition-colors">
                    <TableCell className="font-medium">{workshop.name}</TableCell>
                    <TableCell>{workshop.category}</TableCell>
                    <TableCell>{formatSelectedDates(workshop.selected_dates)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          workshop.status === "active"
                            ? "bg-emerald-500 hover:bg-emerald-600"
                            : workshop.status === "upcoming"
                              ? "bg-amber-500 hover:bg-amber-600"
                              : "bg-gray-500 hover:bg-gray-600"
                        }
                      >
                        {workshop.status.charAt(0).toUpperCase() + workshop.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hover:bg-stei-red/5 hover:text-stei-red transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewWorkshop(workshop.id)
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
