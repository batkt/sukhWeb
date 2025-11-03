import * as React from "react";
import clsx from "clsx";

export type IconTextButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: React.ReactNode;
    label: string;
    showLabelFrom?: "sm" | "md" | "lg" | "xl"; // breakpoint to reveal label
    size?: "sm" | "md" | "lg"; // optional sizing hook
    variant?: "minimal" | "ghost"; // maps to .btn-minimal, .btn-minimal-ghost
  };

/**
 * Consistent icon + (optional) minimal label button used across pages.
 * - Uses theme-aware classes (.btn-minimal / .btn-minimal-ghost)
 * - Hides label on extra-small screens to stay compact
 */
export const IconTextButton = React.forwardRef<
  HTMLButtonElement,
  IconTextButtonProps
>(
  (
    {
      icon,
      label,
      className,
      showLabelFrom = "sm",
      size = "md",
      variant = "minimal",
      ...props
    },
    ref
  ) => {
    const base = variant === "ghost" ? "btn-minimal-ghost" : "btn-minimal";
    const sizeCls =
      size === "sm" ? "px-2 py-1 text-xs" : size === "lg" ? "h-11" : undefined;

    return (
      <button
        ref={ref}
        className={clsx(base, sizeCls, "inline-flex items-center", className)}
        {...props}
      >
        {icon}
        <span
          className={clsx("ml-1 text-xs", `hidden ${showLabelFrom}:inline`)}
        >
          {label}
        </span>
      </button>
    );
  }
);
IconTextButton.displayName = "IconTextButton";

export default IconTextButton;
