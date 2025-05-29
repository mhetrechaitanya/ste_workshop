"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Edit, Plus, Search, Trash, Loader2 } from "lucide-react"
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
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

interface Category {
  id: string
  name: string
  workshops_count?: number
}

export default function WorkshopCategoriesPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [editCategory, setEditCategory] = useState({ id: "", name: "" })
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true })

      if (categoriesError) throw categoriesError

      // For each category, count the number of workshops
      const categoriesWithWorkshopCounts = await Promise.all(
        categoriesData.map(async (category) => {
          const { count, error } = await supabase
            .from("workshops")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id) // Changed from category.name to category.id

          return {
            ...category,
            workshops_count: count || 0,
          }
        }),
      )

      setCategories(categoriesWithWorkshopCounts)
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      fetchCategories()
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .ilike("name", `%${searchQuery}%`)
        .order("name", { ascending: true })

      if (error) throw error

      // For each category, count the number of workshops
      const categoriesWithWorkshopCounts = await Promise.all(
        data.map(async (category) => {
          const { count, error } = await supabase
            .from("workshops")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id) // Changed from category.name to category.id

          return {
            ...category,
            workshops_count: count || 0,
          }
        }),
      )

      setCategories(categoriesWithWorkshopCounts)
      toast({
        title: "Search Results",
        description: `Found ${data.length} categories matching "${searchQuery}"`,
      })
    } catch (error) {
      console.error("Error searching categories:", error)
      toast({
        title: "Error",
        description: "Failed to search categories. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id)

      if (error) throw error

      setCategories(categories.filter((category) => category.id !== id))
      toast({
        title: "Category Deleted",
        description: "The category has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleAddCategory = async () => {
    if (newCategory.trim() === "") {
      toast({
        title: "Error",
        description: "Category name cannot be empty.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([{ name: newCategory }])
        .select()

      if (error) throw error

      setCategories([...categories, { ...data[0], workshops_count: 0 }])
      setNewCategory("")
      setIsAddDialogOpen(false)

      toast({
        title: "Category Added",
        description: "The category has been added successfully.",
      })
    } catch (error) {
      console.error("Error adding category:", error)
      toast({
        title: "Error",
        description: "Failed to add category. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCategory = async () => {
    if (editCategory.name.trim() === "") {
      toast({
        title: "Error",
        description: "Category name cannot be empty.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("categories").update({ name: editCategory.name }).eq("id", editCategory.id)

      if (error) throw error

      setCategories(
        categories.map((category) =>
          category.id === editCategory.id ? { ...category, name: editCategory.name } : category,
        ),
      )
      setIsEditDialogOpen(false)
      toast({
        title: "Category Updated",
        description: "The category has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating category:", error)
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workshop Categories</h1>
          <p className="text-muted-foreground">Manage your workshop categories</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>Enter a name for the new workshop category.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g., Programming, Design, Business"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Category"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-col space-y-4">
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>All Categories</CardTitle>
              <CardDescription>View and manage workshop categories</CardDescription>
            </div>
            <form onSubmit={handleSearch} className="flex items-center space-x-2">
              <Input
                type="search"
                placeholder="Search categories..."
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
                  <TableHead>Category Name</TableHead>
                  <TableHead>Workshops</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2">Loading categories...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No categories found.
                      <Button
                        variant="link"
                        className="p-0 h-auto text-primary"
                        onClick={() => setIsAddDialogOpen(true)}
                      >
                        Add your first category
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.workshops_count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog
                            open={isEditDialogOpen && editCategory.id === category.id}
                            onOpenChange={(open) => {
                              setIsEditDialogOpen(open)
                              if (open) {
                                setEditCategory({ id: category.id, name: category.name })
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Category</DialogTitle>
                                <DialogDescription>Update the category name.</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-name">Category Name</Label>
                                  <Input
                                    id="edit-name"
                                    value={editCategory.name}
                                    onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setIsEditDialogOpen(false)}
                                  disabled={isSubmitting}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={handleEditCategory} disabled={isSubmitting}>
                                  {isSubmitting ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    "Save Changes"
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
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
                                  {category.workshops_count > 0
                                    ? `This category has ${category.workshops_count} workshops associated with it. Deleting it may affect these workshops.`
                                    : "This will permanently delete the category."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={() => handleDelete(category.id)}
                                  disabled={isDeleting === category.id}
                                >
                                  {isDeleting === category.id ? (
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
