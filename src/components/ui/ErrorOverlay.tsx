"use client";

import React from "react";
import toast, { Toaster, ToastBar } from "react-hot-toast";

export function openErrorOverlay(message: string, duration = 3000) {
  toast.error(message, {
    duration,
    position: "top-right",
  });
}

export function openWarningOverlay(message: string, duration = 4000) {
  toast(message, {
    duration,
    position: "top-right",
    icon: "⚠️",
    style: {
      borderLeft: "4px solid var(--warning)",
    }
  });
}

export function ErrorOverlayHost() {
  return (
    <Toaster
      position="top-right"
      containerStyle={{ zIndex: 99999 }}
      toastOptions={{
        // Хатуу бараан (#1e293b) биш — хуудасны өнгө, сонгосон загварын
        // өнгөөр (гэрэл/харанхуй горимд хоёуланд тохирно)
        style: {
          borderRadius: "12px",
          background: "var(--surface-bg)",
          color: "var(--panel-text)",
          border: "1px solid var(--surface-border)",
          fontSize: "14px",
          fontWeight: 400,
          padding: "12px 14px",
          boxShadow: "0 12px 32px -12px rgba(0, 0, 0, 0.25)",
        },
        error: {
          iconTheme: { primary: "var(--danger)", secondary: "#fff" },
          style: {
            borderLeft: "4px solid var(--danger)",
          }
        },
        success: {
          iconTheme: { primary: "var(--theme)", secondary: "#fff" },
          style: {
            borderLeft: "4px solid var(--theme)",
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
