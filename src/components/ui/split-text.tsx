import React from 'react'
import { motion } from 'framer-motion'

interface SplitTextProps {
  children: string
  className?: string
  delay?: number
  stagger?: number
  duration?: number
  ease?: string
}

export const SplitText: React.FC<SplitTextProps> = ({
  children,
  className = '',
  delay = 0,
  stagger = 0.03,
  duration = 0.6,
  ease = 'easeOut'
}) => {
  // テキストを文字単位で分割
  const characters = children.split('')

  return (
    <div className={className}>
      {characters.map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: delay + index * stagger,
            duration,
            ease: "easeOut"
          }}
          style={{ 
            display: 'inline-block',
            transform: 'none',
            transformOrigin: 'center'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </div>
  )
}
