"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Loader2, QuoteIcon } from "lucide-react"

interface Quote {
  id: string
  quote: string
  author: string | null
  category: string
  color: string
}

export function RandomQuote() {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRandomQuote = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("inspiration_quotes")
          .select("id, quote, author, category, color")
          .eq("is_featured", true) // Changed from is_active to is_featured
          .order("created_at", { ascending: false })
          .limit(10)

        if (error) throw error

        if (data && data.length > 0) {
          // Get a random quote from the results
          const randomIndex = Math.floor(Math.random() * data.length)
          setQuote(data[randomIndex])
        }
      } catch (error) {
        console.error("Error fetching random quote:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRandomQuote()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inspirational Quote</CardTitle>
          <CardDescription>Daily motivation</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!quote) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inspirational Quote</CardTitle>
          <CardDescription>Daily motivation</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center h-32 text-center text-muted-foreground">
          <QuoteIcon className="h-8 w-8 mb-2" />
          <p>No featured quotes available. Mark some quotes as featured to see them here.</p>
        </CardContent>
      </Card>
    )
  }

  // Get the background color based on the quote's color
  const getBackgroundColor = () => {
    switch (quote.color) {
      case "yellow":
        return "bg-yellow-50 dark:bg-yellow-950/30"
      case "blue":
        return "bg-blue-50 dark:bg-blue-950/30"
      case "green":
        return "bg-green-50 dark:bg-green-950/30"
      case "purple":
        return "bg-purple-50 dark:bg-purple-950/30"
      case "pink":
        return "bg-pink-50 dark:bg-pink-950/30"
      default:
        return "bg-yellow-50 dark:bg-yellow-950/30"
    }
  }

  // Get the text color based on the quote's color
  const getTextColor = () => {
    switch (quote.color) {
      case "yellow":
        return "text-yellow-800 dark:text-yellow-300"
      case "blue":
        return "text-blue-800 dark:text-blue-300"
      case "green":
        return "text-green-800 dark:text-green-300"
      case "purple":
        return "text-purple-800 dark:text-purple-300"
      case "pink":
        return "text-pink-800 dark:text-pink-300"
      default:
        return "text-yellow-800 dark:text-yellow-300"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inspirational Quote</CardTitle>
        <CardDescription>Daily motivation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`flex flex-col space-y-2 p-4 rounded-lg ${getBackgroundColor()}`}>
          <div className="flex">
            <QuoteIcon className={`h-5 w-5 mr-2 shrink-0 ${getTextColor()}`} />
            <p className={`italic text-lg ${getTextColor()}`}>{quote.quote}</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            — {quote.author || "Unknown"} {quote.category && <span className="text-xs">({quote.category})</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
