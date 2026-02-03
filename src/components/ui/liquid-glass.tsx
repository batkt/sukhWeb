"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowIntensity?: 'sm' | 'md' | 'lg';
  shadowIntensity?: 'sm' | 'md' | 'lg';
  borderRadius?: string;
  blurIntensity?: 'sm' | 'md' | 'lg';
  draggable?: boolean;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className,
  glowIntensity = 'md',
  shadowIntensity = 'md',
  borderRadius = '24px',
  blurIntensity = 'md',
  draggable = false,
}) => {
  const blurMap = {
    sm: 'blur(8px)',
    md: 'blur(16px)',
    lg: 'blur(32px)',
  };

  const shadowMap = {
    sm: '0 10px 30px -10px rgba(0,0,0,0.2)',
    md: '0 20px 40px -15px rgba(0,0,0,0.3)',
    lg: '0 30px 60px -20px rgba(0,0,0,0.4)',
  };

  const glowMap = {
    sm: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1), transparent 50%)',
    md: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15), transparent 60%)',
    lg: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.2), transparent 70%)',
  };

  const MotionDiv = draggable ? motion.div : 'div';

  return (
    <MotionDiv
      {...(draggable ? { 
        drag: true,
        dragConstraints: { left: 0, right: 0, top: 0, bottom: 0 },
        dragElastic: 0.1,
        whileDrag: { scale: 1.02, zIndex: 50 },
      } : {})}
      className={cn(
        "relative overflow-hidden group transition-all duration-500",
        className
      )}
      style={{
        borderRadius,
        backdropFilter: blurMap[blurIntensity],
        WebkitBackdropFilter: blurMap[blurIntensity],
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        boxShadow: shadowMap[shadowIntensity],
        border: '1px solid rgba(255, 255, 255, 0.1)',
      } as any}
    >
      {/* Dynamic Glow Effect */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000 group-hover:opacity-100"
        style={{
          background: glowMap[glowIntensity],
          opacity: 0.5,
        }}
      />
      
      {/* Animated Shine */}
      <motion.div
        initial={{ left: '-100%' }}
        animate={{ left: '200%' }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 5 }}
        className="absolute top-0 w-1/4 h-full skew-x-[-25deg] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        }}
      />

      <div className="relative z-10">
        {children}
      </div>

      {/* Edge Reflection */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent pointer-events-none" />
    </MotionDiv>
  );
};
