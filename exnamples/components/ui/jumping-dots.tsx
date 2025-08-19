"use client"

import { motion, Variants } from "motion/react"

interface JumpingDotsProps {
  className?: string
  size?: "xxs" | "xs" | "sm" | "md" | "lg"
  color?: string
}

export function JumpingDots({ 
  className = "", 
  size = "xxs", 
  color = "currentColor" 
}: JumpingDotsProps) {
  const sizeClasses = {
    xxs: "w-0.1 h-0.1",
    xs: "w-1 h-1",
    sm: "w-2 h-2",
    md: "w-3 h-3", 
    lg: "w-4 h-4"
  }

  const dotVariants: Variants = {
    jump: {
      y: -10,
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      },
    },
  }

  // サイズと色をCSS変数として設定
  const getDotStyle = (size: string) => {
    const sizeMap = {
      xxs: 1,
      xs: 2,
      sm: 4,
      md: 6,
      lg: 8
    }
    return {
      backgroundColor: color,
      width: `${sizeMap[size as keyof typeof sizeMap]}px`,
      height: `${sizeMap[size as keyof typeof sizeMap]}px`,
    }
  }

  return (
    <motion.div
      animate="jump"
      transition={{ staggerChildren: 0.2, staggerDirection: 1 }}
      className={`flex justify-center items-center gap-1 ${className}`}
    >
      <motion.div 
        className="rounded-full"
        style={getDotStyle(size)}
        variants={dotVariants} 
      />
      <motion.div 
        className="rounded-full"
        style={getDotStyle(size)}
        variants={dotVariants} 
      />
      <motion.div 
        className="rounded-full"
        style={getDotStyle(size)}
        variants={dotVariants} 
      />
    </motion.div>
  )
} 