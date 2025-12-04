"use client";

import { useEffect } from "react";
import setupLocator from "@locator/runtime";

export default function LocatorWarningSuppress() {
  useEffect(() => {
    // Only initialize locator in development mode to avoid hydration issues
    if (process.env.NODE_ENV === "development") {
      // Suppress LocatorJS console errors
      const originalError = console.error;
      console.error = (...args) => {
        if (
          typeof args[0] === "string" &&
          args[0].includes("[LocatorJS]")
        ) {
          return;
        }
        originalError.apply(console, args);
      };

      setupLocator();
    }
  }, []);

  return null;
}
