"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children into <body> once the client has mounted.
 * Extracted from the old golContent monolith so modal consumers no longer
 * have to import (and therefore bundle) the entire app shell.
 */
export const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;
  return createPortal(children, document.body);
};

export default ModalPortal;
