"use client";

import React from "react";
import { Button as AntButton } from "antd";
import type { ButtonProps as AntButtonProps } from "antd";
import { cn } from "@/lib/utils";

export interface ButtonProps extends Omit<AntButtonProps, "size" | "variant" | "type"> {
  variant?: "primary" | "secondary" | "back" | "text" | "ghost" | "danger" | "success" | "warning";
  size?: "sm" | "md" | "lg" | "small" | "middle" | "large" | "xs";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  type?: AntButtonProps["type"] | "button" | "submit" | "reset";
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
      htmlType,
      icon,
      ...props
    },
    ref
  ) => {
    // Determine if type is a native HTML type
    const isHtmlType = type === "button" || type === "submit" || type === "reset";

    // Determine Ant Design button type
    const antType = isHtmlType
      ? (variant === "primary" ? "primary" : "default")
      : (type || (variant === "primary" ? "primary" : "default"));

    // Determine native HTML type
    const finalHtmlType = isHtmlType ? (type as any) : htmlType;

    // Base styles from button.md and common patterns
    const baseStyles = "inline-flex items-center justify-center gap-2 transition-all duration-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border-none";

    const variants = {
      primary: "bg-theme hover:bg-theme !text-white shadow-sm dark:hover:bg-theme",
      secondary: "bg-[color:var(--panel)] hover:bg-[color:var(--panel)] !text-[color:var(--panel-text)] dark:!text-[color:var(--muted-text)]",
      back: "!text-[color:var(--muted-text)] !border !border-[color:var(--surface-border)] dark:!border-white dark:!bg-[color:var(--panel)] dark:!text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)]",
      text: "bg-transparent border-none !text-[color:var(--muted-text)] hover:bg-success/10 hover:!text-success dark:!text-[color:var(--muted-text)] dark:hover:bg-white/5",
      ghost: "bg-transparent border border-[color:var(--surface-border)] !text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] dark:!border-white/10 dark:!text-[color:var(--muted-text)] dark:hover:bg-white/5",
      danger: "bg-danger hover:bg-danger !text-white shadow-sm",
      success: "bg-success hover:bg-success !text-white shadow-sm",
      warning: "bg-warning hover:bg-warning !text-white shadow-sm",
    };

    // Size mapping
    const sizes = {
      sm: "h-7 px-2.5 text-[11px]",
      small: "h-7 px-2.5 text-[11px]",
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
        htmlType={finalHtmlType}
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
