"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Mail, ArrowLeft, Download, Plus, Eye } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  // Mock student data - in a real app, this would be fetched from an API
  const student = {
    id: params.id,
    firstName: "Rahul",
    lastName: "Sharma",
    email: "rahul.sharma@example.com",
    phone: "+91 98765 43210",
    address: "123 Main St, Mumbai, Maharashtra, 400001",
    joinedDate: "10 Jan 2025",
    status: "Active",
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Details</h1>
          <p className="text-muted-foreground">View and manage student information</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">
                  {student.firstName.charAt(0)}
                  {student.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4 text-center">
                {student.firstName} {student.lastName}
              </CardTitle>
              <CardDescription className="text-center">Student ID: {student.id}</CardDescription>
              <Badge className="mt-2 bg-green-500">{student.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                <p>{student.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                <p>{student.phone}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                <p>{student.address}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Joined Date</h3>
                <p>{student.joinedDate}</p>
              </div>
              <div className="pt-4 flex flex-col gap-2">
                <Link href={`/students/${student.id}/edit`}>
                  <Button className="w-full">Edit Details</Button>
                </Link>
                <Link href={`/email/send?to=${student.email}`}>
                  <Button variant="outline" className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-0">
            <Tabs defaultValue="workshops" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="workshops">Workshops</TabsTrigger>
                <TabsTrigger value="payments">Payment History</TabsTrigger>
                <TabsTrigger value="emails">Email History</TabsTrigger>
              </TabsList>
              <TabsContent value="workshops" className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Enrolled Workshops</h3>
                  <Link href={`/students/${student.id}/enroll`}>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Enroll in Workshop
                    </Button>
                  </Link>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workshop</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Web Development Bootcamp</TableCell>
                      <TableCell>Batch #3</TableCell>
                      <TableCell>15 Jan 2025</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Active</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Completed</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Data Science Fundamentals</TableCell>
                      <TableCell>Batch #1</TableCell>
                      <TableCell>10 Feb 2025</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Active</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Completed</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="payments" className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Payment History</h3>
                  <Link href={`/students/${student.id}/payment/new`}>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Payment
                    </Button>
                  </Link>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Workshop</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>22 Mar 2025</TableCell>
                      <TableCell>Web Development Bootcamp</TableCell>
                      <TableCell>₹15,000</TableCell>
                      <TableCell>Online Transfer</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Completed</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>15 Feb 2025</TableCell>
                      <TableCell>Data Science Fundamentals</TableCell>
                      <TableCell>₹12,000</TableCell>
                      <TableCell>Credit Card</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Completed</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="emails" className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Email History</h3>
                  <Link href={`/email/send?to=${student.email}`}>
                    <Button size="sm">
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </Button>
                  </Link>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>25 Mar 2025</TableCell>
                      <TableCell>Web Development Bootcamp - Session Reminder</TableCell>
                      <TableCell>Session Reminder</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Delivered</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>20 Mar 2025</TableCell>
                      <TableCell>Payment Confirmation - Web Development Bootcamp</TableCell>
                      <TableCell>Payment Receipt</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Delivered</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>15 Mar 2025</TableCell>
                      <TableCell>Welcome to Web Development Bootcamp</TableCell>
                      <TableCell>Welcome Email</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Delivered</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardContent>{/* Remove content from here as it's now inside the Tabs component */}</CardContent>
        </Card>
      </div>
    </div>
  )
}
