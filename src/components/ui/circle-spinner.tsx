import React from 'react'
import { motion } from 'framer-motion'

interface CircleSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

export const CircleSpinner: React.FC<CircleSpinnerProps> = ({ 
  className = "", 
  size = "md",
  color = "currentColor"
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} border-2 border-t-transparent rounded-full`}
        style={{ borderColor: `${color} transparent ${color} ${color}` }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  )
}
