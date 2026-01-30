"use client";

import React from "react";
import toast, { Toaster, ToastBar } from "react-hot-toast";

export function openErrorOverlay(message: string, duration = 3000) {
  toast.error(message, {
    duration,
    position: "top-right",
  });
}

export function ErrorOverlayHost() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: "12px",
          background: "#1e293b",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 500,
          padding: "16px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
        error: {
          style: {
            borderLeft: "4px solid #ef4444",
          }
        },
        success: {
          style: {
            borderLeft: "4px solid #10b981",
          }
        }
      }}
    >
      {(t) => (
        <div onClick={() => toast.dismiss(t.id)} style={{ cursor: 'pointer' }}>
          <ToastBar toast={t} />
        </div>
      )}
    </Toaster>
  );
}
