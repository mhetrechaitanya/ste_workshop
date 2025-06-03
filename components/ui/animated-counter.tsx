// components/ui/animated-counter.tsx
"use client"

import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { useEffect, useState } from "react"

interface AnimatedCounterProps {
  to: number
  prefix?: string
  locale?: string
}

export function AnimatedCounter({ to, prefix = "", locale = "en-IN" }: AnimatedCounterProps) {
  const count = useMotionValue(0)
  const [display, setDisplay] = useState("0")

  useEffect(() => {
    const controls = animate(count, to, {
      duration: 1.5,
      onUpdate(value) {
        setDisplay(`${prefix}${Math.floor(value).toLocaleString(locale)}`)
      },
    })

    return () => controls.cancel()
  }, [to, count, prefix, locale])

  return <motion.span>{display}</motion.span>
}
