"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

// The form schema should match our database schema
const formSchema = z.object({
  quote: z.string().min(5, {
    message: "Quote must be at least 5 characters.",
  }),
  author: z.string().optional(),
  category: z.string().min(1, {
    message: "Category is required.",
  }),
  is_featured: z.boolean().default(false),
  color: z.string().default("yellow"),
})

const colorOptions = [
  { value: "yellow", label: "Yellow" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "red", label: "Red" },
  { value: "purple", label: "Purple" },
]

interface QuoteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onQuoteAdded: () => void
}

export function QuoteFormDialog({ open, onOpenChange, onQuoteAdded }: QuoteFormDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<string[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quote: "",
      author: "",
      category: "",
      is_featured: false,
      color: "yellow",
    },
  })

  useEffect(() => {
    // Fetch existing categories for the dropdown
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase.from("inspiration_quotes").select("category").not("category", "is", null)

        if (error) throw error

        // Extract unique categories
        const uniqueCategories = Array.from(new Set(data?.map((item) => item.category) || []))
          .filter(Boolean)
          .sort() as string[]

        setCategories(uniqueCategories)
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    if (open) {
      fetchCategories()
      form.reset()
    }
  }, [open, form])

  // Make sure the insert operation matches our schema
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("inspiration_quotes").insert([
        {
          quote: values.quote,
          author: values.author || null,
          category: values.category,
          is_featured: values.is_featured,
          color: values.color,
          // created_at will be set automatically by Supabase
        },
      ])

      if (error) throw error

      toast({
        title: "Quote Added",
        description: "The inspirational quote has been added successfully.",
      })
      onOpenChange(false)
      onQuoteAdded()
      form.reset()
    } catch (error) {
      console.error("Error adding quote:", error)
      toast({
        title: "Error",
        description: "Failed to add quote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Quote</DialogTitle>
          <DialogDescription>Enter the details for the new inspirational quote</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="quote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quote</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the inspirational quote here..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>The inspirational quote text.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author</FormLabel>
                  <FormControl>
                    <Input placeholder="Author name (optional)" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>The person who said or wrote this quote.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input list="categories" placeholder="E.g., Motivation, Success, Education" {...field} />
                      <datalist id="categories">
                        {categories.map((category) => (
                          <option key={category} value={category} />
                        ))}
                      </datalist>
                    </div>
                  </FormControl>
                  <FormDescription>
                    The category this quote belongs to. You can select an existing category or create a new one.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-wrap gap-4"
                    >
                      {colorOptions.map((color) => (
                        <FormItem key={color.value} className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem
                              value={color.value}
                              id={`dialog-color-${color.value}`}
                              className={`border-2 border-${color.value}-500`}
                            />
                          </FormControl>
                          <FormLabel htmlFor={`dialog-color-${color.value}`} className="font-normal">
                            {color.label}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>Select a color for this quote.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_featured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Featured</FormLabel>
                    <FormDescription>Featured quotes will be highlighted in the admin panel.</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Quote"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
