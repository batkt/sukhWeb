"use client";

import React from "react";
import { Button as AntButton } from "antd";
import type { ButtonProps as AntButtonProps } from "antd";
import { cn } from "@/lib/utils";

export interface ButtonProps extends Omit<AntButtonProps, "size" | "variant"> {
  variant?: "primary" | "secondary" | "back" | "text" | "ghost" | "danger" | "success" | "warning";
  size?: "sm" | "md" | "lg" | "small" | "middle" | "large";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      fullWidth = false,
      type,
      icon,
      ...props
    },
    ref
  ) => {
    // Determine Ant Design button type
    const antType = type || (variant === "primary" ? "primary" : "default");

    // Base styles from button.md and common patterns
    const baseStyles = "inline-flex items-center justify-center gap-2 transition-all duration-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border-none";

    const variants = {
      primary: "bg-emerald-500 hover:bg-emerald-400 !text-white shadow-sm dark:bg-emerald-600 dark:hover:bg-emerald-500",
      secondary: "bg-slate-200/50 hover:bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700",
      back: "text-gray-400 !border !border-slate-200 dark:!border-white dark:!bg-gray-800 dark:!text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-700",
      text: "bg-transparent border-none text-gray-600 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-gray-300 dark:hover:bg-white/5",
      ghost: "bg-transparent border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5",
      danger: "bg-red-500 hover:bg-red-400 !text-white shadow-sm dark:bg-red-600 dark:hover:bg-red-500",
      success: "bg-green-500 hover:bg-green-400 !text-white shadow-sm",
      warning: "bg-yellow-500 hover:bg-yellow-400 !text-white shadow-sm",
    };

    // Size mapping
    const sizes = {
      sm: "h-7 px-2.5 text-[10px]",
      small: "h-7 px-2.5 text-[10px]",
      md: "h-8.5 px-3 text-xs",
      middle: "h-8.5 px-3 text-xs",
      lg: "h-10 px-6 text-sm",
      large: "h-10 px-6 text-sm",
    };

    // Combine Ant Design's icon with our leftIcon/rightIcon
    const combinedIcon = leftIcon || icon;

    return (
      <AntButton
        ref={ref as any}
        type={antType as any}
        loading={isLoading || loading}
        disabled={disabled}
        icon={combinedIcon}
        className={cn(
          baseStyles,
          variants[variant as keyof typeof variants] || variants.primary,
          sizes[size as keyof typeof sizes] || sizes.md,
          fullWidth && "w-full",
          className
        )}
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          color: 'white',
          justifyContent: 'center',
          ...props.style 
        }}
        {...props}
      >
        {children}
        {rightIcon && <span className="ml-1 flex-shrink-0">{rightIcon}</span>}
      </AntButton>
    );
  }
);

Button.displayName = "Button";

export default Button;
