import { motion } from "motion/react"
import { ReactNode } from "react"

interface HoverAnimationProps {
  children: ReactNode
  className?: string
  scale?: number
  duration?: number
}

export function HoverAnimation({ 
  children, 
  className = "", 
  scale = 1.05, 
  duration = 0.2 
}: HoverAnimationProps) {
  return (
    <motion.div
      whileHover={{ 
        scale,
        transition: { duration }
      }}
      whileTap={{ 
        scale: 0.95,
        transition: { duration: 0.1 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
} 