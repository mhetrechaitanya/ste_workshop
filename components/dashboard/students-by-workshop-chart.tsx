"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Loader2 } from "lucide-react"

interface WorkshopStudentData {
  name: string
  students: number
}

export function StudentsByWorkshopChart() {
  const [data, setData] = useState<WorkshopStudentData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStudentsByWorkshopData()
  }, [])

  const fetchStudentsByWorkshopData = async () => {
    setIsLoading(true)
    try {
      // In a real app, you would fetch this data from your database
      // For now, we'll set an empty array
      setData([])
    } catch (error) {
      console.error("Error fetching students by workshop data:", error)
      setData([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          formatter={(value: number) => [`${value} students`, "Enrolled"]}
          contentStyle={{
            backgroundColor: "white",
            borderColor: "#e5e7eb",
            borderRadius: "0.375rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
        />
        <Bar dataKey="students" fill="#6b7280" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
