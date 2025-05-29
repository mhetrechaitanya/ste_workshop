"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Loader2 } from "lucide-react"

interface WorkshopStatusData {
  name: string
  value: number
  color: string
}

export function WorkshopStatusChart() {
  const [data, setData] = useState<WorkshopStatusData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchWorkshopStatusData()
  }, [])

  const fetchWorkshopStatusData = async () => {
    setIsLoading(true)
    try {
      // In a real app, you would fetch this data from your database
      // For now, we'll set an empty array
      setData([])
    } catch (error) {
      console.error("Error fetching workshop status data:", error)
      setData([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value} workshops`, "Count"]}
          contentStyle={{
            backgroundColor: "white",
            borderColor: "#e5e7eb",
            borderRadius: "0.375rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
