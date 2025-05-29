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

interface Payment {
  id: string
  payment_date: string
  amount: number
  status: string
  student_name: string
  workshop_name: string
}

export function RecentPayments() {
  const router = useRouter()
  const { toast } = useToast()
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRecentPayments()
  }, [])

  // Update the fetchRecentPayments function to not use mock data
  const fetchRecentPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          payment_date,
          amount,
          status,
          students (
            id,
            first_name,
            last_name
          ),
          batches (
            id,
            workshops (
              id,
              name
            )
          )
        `)
        .order("payment_date", { ascending: false })
        .limit(5)

      if (error) throw error

      // Check if data exists and has the expected structure
      if (!data || !Array.isArray(data)) {
        throw new Error("Invalid data structure received from the server")
      }

      const formattedPayments = data
        .map((payment) => {
          // Check if the required nested objects exist
          if (!payment.students || !payment.batches || !payment.batches.workshops) {
            console.warn("Payment record is missing required related data:", payment)
            return null
          }

          return {
            id: payment.id,
            payment_date: payment.payment_date,
            amount: payment.amount,
            status: payment.status,
            student_name: `${payment.students.first_name} ${payment.students.last_name}`,
            workshop_name: payment.batches.workshops.name,
          }
        })
        .filter(Boolean) as Payment[] // Filter out null values and cast to Payment[]

      setPayments(formattedPayments)
    } catch (error) {
      console.error("Error fetching recent payments:", error)
      toast({
        title: "Error",
        description: "Failed to load recent payments. Please try again.",
        variant: "destructive",
      })

      // Set empty array instead of mock data
      setPayments([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewPayment = (id: string) => {
    router.push(`/payments/${id}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="w-full border-none shadow-md overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">Recent Payments</CardTitle>
          <CardDescription>Latest payment transactions</CardDescription>
        </div>
        <Link href="/payments">
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-emerald-500/5 hover:text-emerald-500 transition-colors"
          >
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-transparent border-b">
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Workshop</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2">Loading payments...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No payments found.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-white/50 dark:hover:bg-black/50 transition-colors">
                    <TableCell className="font-medium">{payment.student_name}</TableCell>
                    <TableCell>{payment.workshop_name}</TableCell>
                    <TableCell className="font-medium text-emerald-600">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          payment.status === "completed"
                            ? "bg-emerald-500 hover:bg-emerald-600"
                            : payment.status === "partial"
                              ? "bg-amber-500 hover:bg-amber-600"
                              : "bg-red-500 hover:bg-red-600"
                        }
                      >
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hover:bg-emerald-500/5 hover:text-emerald-500 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewPayment(payment.id)
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
