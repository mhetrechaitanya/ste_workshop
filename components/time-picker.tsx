"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface TimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
}

export function TimePickerDemo({ date, setDate }: TimePickerProps) {
  const minuteRef = React.useRef<HTMLInputElement>(null)
  const hourRef = React.useRef<HTMLInputElement>(null)
  const secondRef = React.useRef<HTMLInputElement>(null)

  const [hour, setHour] = React.useState<number>(date ? date.getHours() : 0)
  const [minute, setMinute] = React.useState<number>(date ? date.getMinutes() : 0)
  const [second, setSecond] = React.useState<number>(date ? date.getSeconds() : 0)

  React.useEffect(() => {
    if (date) {
      setHour(date.getHours())
      setMinute(date.getMinutes())
      setSecond(date.getSeconds())
    }
  }, [date])

  const handleTimeChange = React.useCallback(() => {
    if (!date) {
      return
    }

    const newDate = new Date(date)
    newDate.setHours(hour)
    newDate.setMinutes(minute)
    newDate.setSeconds(second)
    setDate(newDate)
  }, [date, hour, minute, second, setDate])

  React.useEffect(() => {
    handleTimeChange()
  }, [hour, minute, second, handleTimeChange])

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10)
    if (isNaN(value)) {
      setHour(0)
    } else {
      setHour(Math.max(0, Math.min(23, value)))
    }
    if (value > 2) {
      minuteRef.current?.focus()
    }
  }

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10)
    if (isNaN(value)) {
      setMinute(0)
    } else {
      setMinute(Math.max(0, Math.min(59, value)))
    }
    if (value > 5) {
      secondRef.current?.focus()
    }
  }

  const handleSecondChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10)
    if (isNaN(value)) {
      setSecond(0)
    } else {
      setSecond(Math.max(0, Math.min(59, value)))
    }
  }

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1 text-center">
        <Label htmlFor="hour" className="text-xs">
          Hour
        </Label>
        <Input
          ref={hourRef}
          id="hour"
          className="w-16 text-center"
          value={hour.toString().padStart(2, "0")}
          onChange={handleHourChange}
          type="number"
          min={0}
          max={23}
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="minute" className="text-xs">
          Minute
        </Label>
        <Input
          ref={minuteRef}
          id="minute"
          className="w-16 text-center"
          value={minute.toString().padStart(2, "0")}
          onChange={handleMinuteChange}
          type="number"
          min={0}
          max={59}
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="second" className="text-xs">
          Second
        </Label>
        <Input
          ref={secondRef}
          id="second"
          className="w-16 text-center"
          value={second.toString().padStart(2, "0")}
          onChange={handleSecondChange}
          type="number"
          min={0}
          max={59}
        />
      </div>
      <div className="flex h-10 items-center">
        <Clock className="ml-2 h-4 w-4" />
      </div>
    </div>
  )
}
