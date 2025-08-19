import { motion } from "motion/react"
import { ReactNode } from "react"

interface SlideAnimationProps {
  children: ReactNode
  className?: string
  direction?: "left" | "right" | "up" | "down"
  distance?: number
  duration?: number
  delay?: number
}

export function SlideAnimation({ 
  children, 
  className = "", 
  direction = "left",
  distance = 100,
  duration = 0.5,
  delay = 0
}: SlideAnimationProps) {
  const getSlideVariants = () => {
    const variants = {
      initial: {},
      animate: {},
      exit: {}
    }

    switch (direction) {
      case "left":
        variants.initial = { x: distance, opacity: 0 }
        variants.animate = { x: 0, opacity: 1 }
        variants.exit = { x: -distance, opacity: 0 }
        break
      case "right":
        variants.initial = { x: -distance, opacity: 0 }
        variants.animate = { x: 0, opacity: 1 }
        variants.exit = { x: distance, opacity: 0 }
        break
      case "up":
        variants.initial = { y: distance, opacity: 0 }
        variants.animate = { y: 0, opacity: 1 }
        variants.exit = { y: -distance, opacity: 0 }
        break
      case "down":
        variants.initial = { y: -distance, opacity: 0 }
        variants.animate = { y: 0, opacity: 1 }
        variants.exit = { y: distance, opacity: 0 }
        break
    }

    return variants
  }

  return (
    <motion.div
      variants={getSlideVariants()}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        duration,
        delay,
        ease: "easeInOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
} 