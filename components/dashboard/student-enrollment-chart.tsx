"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Loader2 } from "lucide-react"

interface EnrollmentData {
  name: string
  students: number
}

export function StudentEnrollmentChart() {
  const [data, setData] = useState<EnrollmentData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchEnrollmentData()
  }, [])

  const fetchEnrollmentData = async () => {
    setIsLoading(true)
    try {
      // In a real app, you would fetch this data from your database
      // For now, we'll set an empty array
      setData([])
    } catch (error) {
      console.error("Error fetching enrollment data:", error)
      setData([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value: number) => [`${value} students`, "Enrollments"]}
          contentStyle={{
            backgroundColor: "white",
            borderColor: "#e5e7eb",
            borderRadius: "0.375rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
        />
        <defs>
          <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2} />
          </linearGradient>
        </defs>
        <Bar dataKey="students" fill="url(#colorStudents)" radius={[4, 4, 0, 0]} barSize={30} />
      </BarChart>
    </ResponsiveContainer>
  )
}
