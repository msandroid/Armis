import React from 'react'
import { motion } from 'framer-motion'

interface JumpingDotsProps {
  className?: string
  color?: string
}

export const JumpingDots: React.FC<JumpingDotsProps> = ({ 
  className = "", 
  color = "white" 
}) => {
  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-1 h-1 rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
