"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BookOpen,
  Calendar,
  CreditCard,
  Loader2,
  TrendingUp,
  Users,
  Plus,
  Clock,
  CheckCircle2,
  DollarSign,
} from "lucide-react"
import { RecentWorkshops } from "@/components/dashboard/recent-workshops"
import { UpcomingBatches } from "@/components/dashboard/upcoming-batches"
import { RecentPayments } from "@/components/dashboard/recent-payments"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { StudentEnrollmentChart } from "@/components/dashboard/student-enrollment-chart"
import Link from "next/link"
import { WorkshopStatusChart } from "@/components/dashboard/workshop-status-chart"
import { StudentsByWorkshopChart } from "@/components/dashboard/students-by-workshop-chart"
// Import the RandomQuote component
import { RandomQuote } from "@/components/dashboard/random-quote"
import { AnimatedCounter } from "@/components/ui/animated-counter"

interface DashboardStats {
  totalWorkshops: number
  activeBatches: number
  totalStudents: number
  totalRevenue: number
  workshopGrowth: number
  batchGrowth: number
  studentGrowth: number
  revenueGrowth: number
  completionRate: number
  upcomingBatches: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalWorkshops: 0,
    activeBatches: 0,
    totalStudents: 0,
    totalRevenue: 0,
    workshopGrowth: 0,
    batchGrowth: 0,
    studentGrowth: 0,
    revenueGrowth: 0,
    completionRate: 0,
    upcomingBatches: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  // Replace the fetchDashboardStats function with a version that doesn't set mock data
  const fetchDashboardStats = async () => {
    setIsLoading(true)
    try {
      // Get total workshops
      const { count: workshopsCount, error: workshopsError } = await supabase
        .from("workshops")
        .select("*", { count: "exact", head: true })

      if (workshopsError) throw workshopsError

      // Get active batches
      const { count: activeBatchesCount, error: batchesError } = await supabase
        .from("batches")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")

      if (batchesError) throw batchesError

      // Get upcoming batches
      const today = new Date().toISOString().split("T")[0]
      const { count: upcomingBatchesCount, error: upcomingBatchesError } = await supabase
        .from("batches")
        .select("*", { count: "exact", head: true })
        .eq("status", "upcoming")
        .gte("start_date", today)

      if (upcomingBatchesError) throw upcomingBatchesError

      // Get total students
      const { count: studentsCount, error: studentsError } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })

      if (studentsError) throw studentsError

      // Get total revenue
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "completed")

      if (paymentsError) throw paymentsError

      const totalRevenue = paymentsData ? paymentsData.reduce((sum, payment) => sum + payment.amount, 0) : 0

      // Calculate growth percentages (would be calculated from real data in a production app)
      const workshopGrowth = 0
      const batchGrowth = 0
      const studentGrowth = 0
      const revenueGrowth = 0
      const completionRate = 0

      setStats({
        totalWorkshops: workshopsCount || 0,
        activeBatches: activeBatchesCount || 0,
        totalStudents: studentsCount || 0,
        totalRevenue: totalRevenue || 0,
        workshopGrowth,
        batchGrowth,
        studentGrowth,
        revenueGrowth,
        completionRate,
        upcomingBatches: upcomingBatchesCount || 0,
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics. Please try again.",
        variant: "destructive",
      })

      // Set zeros instead of mock data
      setStats({
        totalWorkshops: 0,
        activeBatches: 0,
        totalStudents: 0,
        totalRevenue: 0,
        workshopGrowth: 0,
        batchGrowth: 0,
        studentGrowth: 0,
        revenueGrowth: 0,
        completionRate: 0,
        upcomingBatches: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const QuickActionButton = ({
    icon,
    label,
    href,
    color,
  }: { icon: React.ReactNode; label: string; href: string; color: string }) => (
    <Link href={href}>
      <Button
        variant="outline"
        className={`h-auto w-full flex flex-col items-center justify-center gap-2 p-4 hover:bg-${color}/5 hover:text-${color} hover:border-${color}/20 transition-all border-none shadow-sm hover:shadow-md`}
      >
        <div className={`h-10 w-10 rounded-full bg-${color}/10 flex items-center justify-center`}>{icon}</div>
        <span className="text-sm font-medium">{label}</span>
      </Button>
    </Link>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your workshop management system</p>
        </div>
        <div className="flex gap-2">
          <Link href="/workshops/new">
            <Button className="bg-stei-red hover:bg-stei-red/90">
              <Plus className="mr-2 h-4 w-4" />
              New Workshop
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <Card className="col-span-2">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
      <DollarSign className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        <AnimatedCounter to={500} prefix="₹" />
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Total Workshops</CardTitle>
      <Users className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        <AnimatedCounter to={stats.totalWorkshops} />
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
      <CreditCard className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        <AnimatedCounter to={stats.activeBatches} />
      </div>
    </CardContent>
  </Card>
</div>



        {/* Additional Stats Cards */}
        {/* <div className="mt-6">
          <RandomQuote />
        </div> */}

        {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <RandomQuote /> */}
          {/* Other dashboard components */}
        {/* </div> */}

        {/* <div className="grid gap-4 md:grid-cols-3">
          <Card className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg">
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold">{stats.completionRate}%</div>
                  <div className="w-full bg-purple-100 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-purple-500 h-2.5 rounded-full"
                      style={{ width: `${stats.completionRate}%` }}
                    ></div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg">
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Batches</CardTitle>
              <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-indigo-500" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold">{stats.upcomingBatches}</div>
                  <div className="flex items-center text-xs text-indigo-500 font-medium mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>Starting this month</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg">
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Revenue per Student</CardTitle>
              <div className="h-10 w-10 rounded-full bg-pink-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-pink-500" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold">
                    {formatCurrency(stats.totalStudents > 0 ? stats.totalRevenue / stats.totalStudents : 0)}
                  </div>
                  <div className="flex items-center text-xs text-pink-500 font-medium mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>Per enrolled student</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div> */}

        {/* Quick Actions */}
        {/* <div>
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton
              icon={<BookOpen className="h-5 w-5 text-stei-red" />}
              label="Add Workshop"
              href="/workshops/new"
              color="stei-red"
            />
            <QuickActionButton
              icon={<Calendar className="h-5 w-5 text-gray-500" />}
              label="Create Batch"
              href="/batches/new"
              color="gray-500"
            />
            <QuickActionButton
              icon={<Users className="h-5 w-5 text-amber-500" />}
              label="Add Student"
              href="/students/new"
              color="amber-500"
            />
            <QuickActionButton
              icon={<CreditCard className="h-5 w-5 text-emerald-500" />}
              label="View Payments"
              href="/payments"
              color="emerald-500"
            />
          </div>
        </div> */}

        {/* Charts */}
        {/* <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-none shadow-md overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stei-red to-stei-red/50"></div>
            <CardHeader>
              <CardTitle className="text-xl">Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart />
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-500/50"></div>
            <CardHeader>
              <CardTitle className="text-xl">Student Enrollment</CardTitle>
            </CardHeader>
            <CardContent>
              <StudentEnrollmentChart />
            </CardContent>
          </Card>
        </div> */}

        {/* Additional Charts */}
        {/* <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-none shadow-md overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-500/50"></div>
            <CardHeader>
              <CardTitle className="text-xl">Workshop Status</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkshopStatusChart />
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-500/50"></div>
            <CardHeader>
              <CardTitle className="text-xl">Students by Workshop</CardTitle>
            </CardHeader>
            <CardContent>
              <StudentsByWorkshopChart />
            </CardContent>
          </Card>
        </div> */}

        {/* Recent Data */}
        <div className="grid gap-6 md:grid-cols-2">
          <RecentWorkshops />
          <UpcomingBatches />
        </div>

        <RecentPayments />
      </div>
    </div>
  )
}
