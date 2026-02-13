
import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rectangular',
  width,
  height
}) => {
  const baseClasses = "animate-pulse bg-gray-200/80 rounded";
  
  const variants = {
    text: "h-4 w-full rounded",
    circular: "rounded-full",
    rectangular: "rounded-md"
  };

  const style = {
      width: width,
      height: height
  };

  return (
    <div 
      className={`${baseClasses} ${variants[variant]} ${className}`} 
      style={style}
    />
  );
};
