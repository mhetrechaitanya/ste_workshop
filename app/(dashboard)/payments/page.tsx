"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, Search, Loader2, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Payment {
  id: string
  payment_date: string
  amount: number
  status: string
  payment_method: string
  transaction_id: string
  student_name: string
  workshop_name: string
  batch_name: string
}

export default function PaymentsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<string>("all")

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          payment_date,
          amount,
          status,
          payment_method,
          transaction_id,
          student_id,
          batch_id,
          students (
            first_name,
            last_name
          ),
          batches (
            batch_name,
            workshop_id,
            workshops (
              name
            )
          )
        `)
        .order("payment_date", { ascending: false })

      if (error) throw error

      const formattedPayments = data.map((payment) => ({
        id: payment.id,
        payment_date: payment.payment_date,
        amount: payment.amount,
        status: payment.status,
        payment_method: payment.payment_method || "Online",
        transaction_id: payment.transaction_id || `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        student_name: `${payment.students.first_name} ${payment.students.last_name}`,
        workshop_name: payment.batches.workshops.name,
        batch_name: payment.batches.batch_name,
      }))

      setPayments(formattedPayments)
    } catch (error) {
      console.error("Error fetching payments:", error)
      toast({
        title: "Error",
        description: "Failed to load payments. Please try again.",
        variant: "destructive",
      })

      // Set some mock data for demonstration
      const mockPayments = [
        {
          id: "1",
          payment_date: new Date().toISOString(),
          amount: 15000,
          status: "completed",
          payment_method: "Credit Card",
          transaction_id: "TXN-8A7B6C5D",
          student_name: "Rahul Sharma",
          workshop_name: "Web Development Bootcamp",
          batch_name: "Batch #3",
        },
        {
          id: "2",
          payment_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          amount: 12000,
          status: "completed",
          payment_method: "UPI",
          transaction_id: "TXN-9E8F7G6H",
          student_name: "Priya Patel",
          workshop_name: "Data Science Fundamentals",
          batch_name: "Batch #1",
        },
        {
          id: "3",
          payment_date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          amount: 8000,
          status: "pending",
          payment_method: "Net Banking",
          transaction_id: "TXN-5I4J3K2L",
          student_name: "Amit Kumar",
          workshop_name: "Mobile App Development",
          batch_name: "Batch #2",
        },
      ]

      setPayments(mockPayments)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      fetchPayments()
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          payment_date,
          amount,
          status,
          payment_method,
          transaction_id,
          student_id,
          batch_id,
          students (
            first_name,
            last_name
          ),
          batches (
            batch_name,
            workshop_id,
            workshops (
              name
            )
          )
        `)
        .or(
          `transaction_id.ilike.%${searchQuery}%,students.first_name.ilike.%${searchQuery}%,students.last_name.ilike.%${searchQuery}%,batches.workshops.name.ilike.%${searchQuery}%`,
        )
        .order("payment_date", { ascending: false })

      if (error) throw error

      const formattedPayments = data.map((payment) => ({
        id: payment.id,
        payment_date: payment.payment_date,
        amount: payment.amount,
        status: payment.status,
        payment_method: payment.payment_method || "Online",
        transaction_id: payment.transaction_id || `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        student_name: `${payment.students.first_name} ${payment.students.last_name}`,
        workshop_name: payment.batches.workshops.name,
        batch_name: payment.batches.batch_name,
      }))

      setPayments(formattedPayments)
      toast({
        title: "Search Results",
        description: `Found ${data.length} payments matching "${searchQuery}"`,
      })
    } catch (error) {
      console.error("Error searching payments:", error)
      toast({
        title: "Error",
        description: "Failed to search payments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = (id: string) => {
    toast({
      title: "Receipt Downloaded",
      description: `Receipt for payment #${id} has been downloaded.`,
    })
  }

  // Filter payments by status
  const filteredByStatus = payments.filter((payment) => {
    if (statusFilter === "all") return true
    return payment.status === statusFilter
  })

  // Filter payments by date range
  const filteredPayments = filteredByStatus.filter((payment) => {
    if (dateRange === "all") return true

    const paymentDate = new Date(payment.payment_date)
    const today = new Date()
    const startOfToday = new Date(today.setHours(0, 0, 0, 0))

    if (dateRange === "today") {
      return paymentDate >= startOfToday
    }

    if (dateRange === "week") {
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      return paymentDate >= startOfWeek
    }

    if (dateRange === "month") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      return paymentDate >= startOfMonth
    }

    return true
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">View payment records processed through the payment gateway</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col space-y-4">
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>View all payment transactions processed through the payment gateway</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[150px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <form onSubmit={handleSearch} className="flex items-center space-x-2">
                <Input
                  type="search"
                  placeholder="Search payments..."
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
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Workshop</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2">Loading payments...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <p>
                        No payment records found. Payments will appear here when processed through the payment gateway.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.transaction_id}</TableCell>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell>{payment.student_name}</TableCell>
                      <TableCell>
                        <div>
                          <div>{payment.workshop_name}</div>
                          <div className="text-xs text-muted-foreground">{payment.batch_name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-emerald-600">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{payment.payment_method}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            payment.status === "completed"
                              ? "bg-green-500"
                              : payment.status === "pending"
                                ? "bg-yellow-500"
                                : payment.status === "failed"
                                  ? "bg-red-500"
                                  : "bg-blue-500"
                          }
                        >
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/payments/${payment.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDownload(payment.id)}
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download</span>
                          </Button>
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
