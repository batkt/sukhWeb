"use client";

import React from "react";
import toast from "react-hot-toast";

export function openSuccessOverlay(message: string, duration = 1600) {
  toast.success(message, {
    duration,
    position: "top-right",
  });
}

export function SuccessOverlayHost() {
  return null;
}
