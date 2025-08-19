import { motion } from "motion/react"
import { ReactNode } from "react"

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: "up" | "down" | "left" | "right"
}

export function FadeIn({ 
  children, 
  className = "", 
  delay = 0, 
  duration = 0.5,
  direction = "up"
}: FadeInProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: 20 }
      case "down":
        return { opacity: 0, y: -20 }
      case "left":
        return { opacity: 0, x: 20 }
      case "right":
        return { opacity: 0, x: -20 }
      default:
        return { opacity: 0, y: 20 }
    }
  }

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration,
        delay,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
} 