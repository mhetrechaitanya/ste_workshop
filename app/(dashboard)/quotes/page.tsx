"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Plus, Search, Trash, Loader2 } from "lucide-react"
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
import { QuoteFormDialog } from "@/components/quotes/quote-form-dialog"
import Link from "next/link"

// Update the QuoteItem interface to match our schema
interface QuoteItem {
  id: string
  quote: string
  author: string | null
  category: string
  is_featured: boolean
  color: string
  created_at: string
}

export default function QuotesPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [quotes, setQuotes] = useState<QuoteItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchQuotes()
  }, [])

  // Make sure the fetchQuotes function handles the schema correctly
  const fetchQuotes = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("inspiration_quotes")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      setQuotes(data || [])

      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data?.map((item) => item.category) || []))
        .filter(Boolean)
        .sort() as string[]

      setCategories(uniqueCategories)
    } catch (error) {
      console.error("Error fetching quotes:", error)
      toast({
        title: "Error",
        description: "Failed to load inspirational quotes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      fetchQuotes()
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("inspiration_quotes")
        .select("*")
        .or(`quote.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`)
        .order("created_at", { ascending: false })

      if (error) throw error

      setQuotes(data || [])
      toast({
        title: "Search Results",
        description: `Found ${data.length} quotes matching "${searchQuery}"`,
      })
    } catch (error) {
      console.error("Error searching quotes:", error)
      toast({
        title: "Error",
        description: "Failed to search quotes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      const { error } = await supabase.from("inspiration_quotes").delete().eq("id", id)

      if (error) throw error

      setQuotes(quotes.filter((quote) => quote.id !== id))
      toast({
        title: "Quote Deleted",
        description: "The inspirational quote has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting quote:", error)
      toast({
        title: "Error",
        description: "Failed to delete quote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  // Update the toggleQuoteStatus function to use is_featured instead of is_active
  const toggleQuoteStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("inspiration_quotes").update({ is_featured: !currentStatus }).eq("id", id)

      if (error) throw error

      setQuotes(quotes.map((quote) => (quote.id === id ? { ...quote, is_featured: !currentStatus } : quote)))

      toast({
        title: "Status Updated",
        description: `Quote is now ${!currentStatus ? "featured" : "not featured"}.`,
      })
    } catch (error) {
      console.error("Error updating quote status:", error)
      toast({
        title: "Error",
        description: "Failed to update quote status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Filter quotes by category
  const filteredQuotes = quotes.filter((quote) => {
    if (categoryFilter === "all") return true
    return quote.category === categoryFilter
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inspirational Quotes</h1>
          <p className="text-muted-foreground">Manage inspirational quotes displayed in the admin panel</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Quote
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col space-y-4">
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>All Quotes</CardTitle>
              <CardDescription>View and manage inspirational quotes</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <form onSubmit={handleSearch} className="flex items-center space-x-2">
                <Input
                  type="search"
                  placeholder="Search quotes..."
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
                  <TableHead>Quote</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Category</TableHead>
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
                        <span className="ml-2">Loading quotes...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredQuotes.length === 0 ? (
                  // Update the "No quotes found" message to use the dialog
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No quotes found.
                      <Button variant="link" className="p-0 h-auto font-normal" onClick={() => setIsDialogOpen(true)}>
                        Add your first quote
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="max-w-md">
                        <div className="truncate font-medium">{quote.quote}</div>
                      </TableCell>
                      <TableCell>{quote.author || "Unknown"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {quote.category || "General"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={quote.is_featured ? "bg-green-500" : "bg-gray-500"}
                          onClick={() => toggleQuoteStatus(quote.id, quote.is_featured)}
                          style={{ cursor: "pointer" }}
                        >
                          {quote.is_featured ? "Featured" : "Not Featured"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/quotes/${quote.id}/edit`}>
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
                                  This will permanently delete this inspirational quote. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={() => handleDelete(quote.id)}
                                  disabled={isDeleting === quote.id}
                                >
                                  {isDeleting === quote.id ? (
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
      <QuoteFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onQuoteAdded={fetchQuotes} />
    </div>
  )
}
