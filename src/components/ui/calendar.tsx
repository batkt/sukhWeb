"use client";

import * as React from "react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = DayPickerProps & {
  className?: string;
};

// Shadcn-style Calendar wrapper for react-day-picker with Tailwind classes
// Adds weekend/outside styling and theme-aware hover behavior.
export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  modifiers,
  modifiersClassNames,
  ...props
}: CalendarProps) {
  const isDropdown = (props as any)?.captionLayout === "dropdown";
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        // Root table wrappers
        months: "flex flex-row gap-4",
        // Make month a flex column so caption and nav stack naturally and we can control order
        month: "flex flex-col items-stretch gap-2",
        // Caption above, nav beneath
        caption: "order-1 flex flex-col items-center gap-1 pb-1",
        caption_label: isDropdown
          ? "hidden"
          : "text-sm font-semibold tracking-wide text-theme text-center",
        // Remove default absolute positioning by forcing static, center under caption
        nav: isDropdown
          ? "hidden"
          : "order-2 absolute top-5 left-28 w-full flex items-center justify-center",
        nav_button: cn(
          "h-14 w-14 sm:h-16 sm:w-16 rounded-xl",
          "inline-flex items-center justify-center text-theme text-2xl hover:bg-white dark:hover:bg-black transition-all"
        ),
        nav_button_previous: "",
        nav_button_next: "",

        table: "w-full border-collapse mt-2",
        head_row: "text-[11px] sm:text-xs text-subtle",
        head_cell: "font-medium text-center",
        row: "",
        cell: "p-0.5 sm:p-1 text-center align-middle",
        day: cn(
          // Base day button - responsive sizing
          "h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-xs sm:text-sm font-medium",
          // Hover with primary color
          "transition-colors hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary",
          // Ensure selected state stays visible
          "aria-selected:opacity-100"
        ),
        day_button: "flex h-full w-full items-center justify-center",
        day_today: "outline outline-2 outline-primary",
        day_selected: cn(
          "bg-primary text-white dark:text-black",
          "hover:bg-primary/90 hover:text-white dark:hover:text-black"
        ),
        day_outside: "text-neutral-400 dark:text-neutral-500",
        day_disabled: "opacity-40 cursor-not-allowed",
        ...classNames,
      }}
      modifiers={{
        weekend: { dayOfWeek: [0, 6] },
        ...modifiers,
      }}
      modifiersClassNames={{
        weekend: "text-red-500 dark:text-red-400",
        outside: "text-neutral-400 dark:text-neutral-500",
        selected: "bg-primary text-white dark:text-black",
        range_start: "bg-primary text-white dark:text-black",
        range_end: "bg-primary text-white dark:text-black",
        range_middle:
          "bg-primary/10 text-theme dark:bg-primary/20 dark:text-theme",
        disabled: "opacity-40",
        today: "outline outline-2 outline-primary",
        ...modifiersClassNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? <span>‹</span> : <span>›</span>,
      }}
      {...props}
    />
  );
}

export default Calendar;
