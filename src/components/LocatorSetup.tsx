"use client";

import { useEffect } from "react";

export default function LocatorSetup() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // Delay initialization to ensure hydration is complete
      const timer = setTimeout(() => {
        import("@locator/runtime").then((locatorRuntime) => {
          locatorRuntime.default();
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}
