"use client";

import { useEffect } from "react";

export default function LocatorWarningSuppress() {
  useEffect(() => {
    // Suppress hydration warnings for locator attributes
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes("data-locatorjs")
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
}
