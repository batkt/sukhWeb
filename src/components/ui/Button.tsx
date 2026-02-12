"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    const baseStyles = "inline-flex items-center justify-center gap-2  transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 border";

    const variants = {
      primary: "bg-blue-600 !text-white border-blue-700 hover:bg-blue-700 shadow-md hover:scale-[1.02] active:scale-[0.98]",
      secondary: "bg-slate-600 !text-white border-slate-700 hover:bg-slate-700 shadow-md hover:scale-[1.02] active:scale-[0.98]",
      success: "bg-green-600 !text-white border-green-700 hover:bg-green-700 shadow-md hover:scale-[1.02] active:scale-[0.98]",
      warning: "bg-yellow-600 !text-white border-yellow-700 hover:bg-yellow-700 shadow-md hover:scale-[1.02] active:scale-[0.98]",
      danger: "bg-red-600 !text-white border-red-700 hover:bg-red-700 shadow-md hover:scale-[1.02] active:scale-[0.98]",
      ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98]",
      outline: "bg-transparent text-slate-700 dark:text-slate-300 border-2 border-slate-600 dark:border-slate-400 hover:bg-slate-600 hover:text-white dark:hover:bg-slate-500 hover:scale-[1.02] active:scale-[0.98]",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-[10px]",
      md: "px-4 py-2 text-xs",
      lg: "px-6 py-3 text-sm",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            <span>Хадгалж байна...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
