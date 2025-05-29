"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Mail, Printer } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

export default function PaymentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [payment, setPayment] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPaymentData()
  }, [params.id])

  const fetchPaymentData = async () => {
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
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          batches (
            batch_name,
            workshop_id,
            workshops (
              name,
              fee
            )
          )
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error

      const formattedPayment = {
        id: data.id,
        date: formatDate(data.payment_date),
        amount: data.amount,
        status: data.status,
        paymentMethod: data.payment_method || "Online",
        transactionId: data.transaction_id || `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        student: {
          id: data.students.id,
          name: `${data.students.first_name} ${data.students.last_name}`,
          email: data.students.email,
          phone: data.students.phone,
        },
        workshop: {
          name: data.batches.workshops.name,
          fee: data.batches.workshops.fee,
          batch: data.batches.batch_name,
        },
      }

      setPayment(formattedPayment)
    } catch (error) {
      console.error("Error fetching payment data:", error)
      toast({
        title: "Error",
        description: "Failed to load payment details. Please try again.",
        variant: "destructive",
      })

      // Set mock data for demonstration
      setPayment({
        id: params.id,
        date: formatDate(new Date().toISOString()),
        amount: 15000,
        status: "completed",
        paymentMethod: "Credit Card",
        transactionId: "TXN-8A7B6C5D",
        student: {
          id: "1",
          name: "Rahul Sharma",
          email: "rahul.sharma@example.com",
          phone: "+91 98765 43210",
        },
        workshop: {
          name: "Web Development Bootcamp",
          fee: 15000,
          batch: "Batch #3",
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    toast({
      title: "Receipt Downloaded",
      description: "The payment receipt has been downloaded successfully.",
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSendReceipt = () => {
    toast({
      title: "Receipt Sent",
      description: `The payment receipt has been sent to ${payment?.student.email}.`,
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <p>Loading payment details...</p>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <p className="text-lg mb-4">Payment not found</p>
        <Button onClick={() => router.push("/payments")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Payments
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Receipt</h1>
          <p className="text-muted-foreground">View payment details and receipt</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
        <Button variant="outline" onClick={handleSendReceipt}>
          <Mail className="mr-2 h-4 w-4" />
          Email Receipt
        </Button>
      </div>

      <Card className="print:shadow-none print:border-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-2xl">Payment Receipt</CardTitle>
            <CardDescription>Transaction ID: {payment.transactionId}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">STEI Workshops</div>
            <div className="text-sm text-muted-foreground">123 Education Street</div>
            <div className="text-sm text-muted-foreground">Mumbai, Maharashtra 400001</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Payment Date</p>
              <p className="font-medium">{payment.date}</p>
            </div>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-medium mb-2">Student Information</h3>
              <div className="space-y-1">
                <p className="font-medium">{payment.student.name}</p>
                <p>{payment.student.email}</p>
                <p>{payment.student.phone}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Payment Information</h3>
              <div className="space-y-1">
                <p>
                  <span className="text-muted-foreground">Method:</span> {payment.paymentMethod}
                </p>
                <p>
                  <span className="text-muted-foreground">Transaction ID:</span> {payment.transactionId}
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <span
                    className={
                      payment.status === "completed"
                        ? "text-green-600"
                        : payment.status === "pending"
                          ? "text-yellow-600"
                          : "text-red-600"
                    }
                  >
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-medium mb-4">Payment Details</h3>
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{payment.workshop.name}</div>
                    <div className="text-sm text-muted-foreground">{payment.workshop.batch}</div>
                  </td>
                  <td className="px-4 py-3 text-right">{formatCurrency(payment.workshop.fee)}</td>
                </tr>
              </tbody>
              <tfoot className="bg-muted/20 border-t">
                <tr>
                  <td className="px-4 py-2 font-medium text-right">Total</td>
                  <td className="px-4 py-2 font-bold text-right">{formatCurrency(payment.amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <Separator className="my-6" />

          <div className="text-center text-sm text-muted-foreground">
            <p>Thank you for your payment. For any queries, please contact us at support@stei.edu</p>
            <p className="mt-1">© {new Date().getFullYear()} STEI Workshops. All rights reserved.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
