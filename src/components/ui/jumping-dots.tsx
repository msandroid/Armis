import React from 'react'
import { motion } from 'framer-motion'

interface JumpingDotsProps {
  className?: string
  color?: string
  pauseDuration?: number // ドットが止まる秒数（デフォルト: 0.2秒）
}

export const JumpingDots: React.FC<JumpingDotsProps> = ({ 
  className = "", 
  color = "#5A5A5A",
  pauseDuration = 0.2
}) => {
  // 秩序立ったアニメーションのためのカスタムキーフレーム
  const getCustomAnimation = (index: number) => {
    const baseDelay = index * 0.2
    const totalDuration = 1.2
    
    return {
      y: [0, -4, 0],
      transition: {
        duration: totalDuration,
        repeat: Infinity,
        delay: baseDelay,
        ease: "easeInOut",
        times: [0, 0.4, 1]
      }
    }
  }

  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-[0.25rem] h-[0.25rem] rounded-full" // 4px = 0.25rem
          style={{ backgroundColor: color }}
          animate={getCustomAnimation(index)}
        />
      ))}
    </div>
  )
}
