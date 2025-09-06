import React from 'react';

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
}

export const ShimmerText: React.FC<ShimmerTextProps> = ({ children, className = '' }) => {
  return (
    <span
      className={`inline-block bg-gradient-to-r from-transparent via-white/80 to-transparent bg-clip-text text-transparent animate-shimmer ${className}`}
      style={{
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animationTimingFunction: 'linear',
      }}
    >
      {children}
    </span>
  );
};
