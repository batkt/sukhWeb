"use client";

// Import driver.js css once on client so the overlay styles are available
import "driver.js/dist/driver.css";

export default function TourHost() {
  return (
    <style jsx global>{`
      .premium-driver-popover {
        background: rgba(255, 255, 255, 0.85) !important;
        backdrop-filter: blur(20px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        border-radius: 24px !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        padding: 24px !important;
        max-width: 320px !important;
        color: #1e293b !important;
        animation: driver-fade-in 0.3s ease-out !important;
      }

      .dark .premium-driver-popover {
        background: rgba(15, 23, 42, 0.85) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        color: #f1f5f9 !important;
      }

      @keyframes driver-fade-in {
        from { opacity: 0; transform: translateY(10px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .driver-popover-title {
        font-family: inherit !important;
        font-weight: 800 !important;
        font-size: 1.25rem !important;
        margin-bottom: 8px !important;
        color: inherit !important;
      }

      .driver-popover-description {
        font-family: inherit !important;
        font-size: 0.95rem !important;
        line-height: 1.6 !important;
        color: inherit !important;
        opacity: 0.9 !important;
        max-height: 300px !important;
        overflow-y: auto !important;
        padding-right: 4px !important;
      }

      .driver-popover-description::-webkit-scrollbar {
        width: 4px;
      }
      .driver-popover-description::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 10px;
      }

      .driver-popover-progress-text {
        font-size: 0.75rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
        color: #3b82f6 !important;
        margin-bottom: 16px !important;
        display: block !important;
        background: rgba(59, 130, 246, 0.1);
        padding: 4px 12px;
        border-radius: 99px;
        width: fit-content;
      }

      .driver-popover-btn {
        font-family: inherit !important;
        font-size: 13px !important;
        font-weight: 400 !important;
        padding: 8px 16px !important;
        border-radius: 12px !important;
        border: 1px solid transparent !important;
        background: #f1f5f9 !important;
        color: #475569 !important;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        text-shadow: none !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
        letter-spacing: normal !important;
      }

      .driver-popover-btn:hover {
        background: #e2e8f0 !important;
        color: #1e293b !important;
        transform: translateY(-1px) !important;
      }

      .driver-popover-next-btn {
        background: #3b82f6 !important;
        color: #ffffff !important;
        text-shadow: none !important;
        font-weight: 400 !important;
      }

      .driver-popover-next-btn:hover {
        background: #2563eb !important;
        color: #ffffff !important;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2) !important;
      }

      .driver-popover-prev-btn {
        background: #f1f5f9 !important;
        color: #475569 !important;
      }

      /* Close button (X) in top right */
      .driver-popover-close-btn {
        position: absolute !important;
        top: 14px !important;
        right: 14px !important;
        width: 28px !important;
        height: 28px !important;
        padding: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 50% !important;
        background: transparent !important;
        color: #94a3b8 !important;
        font-size: 18px !important;
        font-weight: 400 !important;
        border: none !important;
        transition: all 0.2s !important;
      }

      .driver-popover-close-btn:hover {
        background: rgba(0, 0, 0, 0.05) !important;
        color: #64748b !important;
        transform: rotate(90deg) !important;
      }

      .dark .driver-popover-close-btn:hover {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #f1f5f9 !important;
      }

      .driver-popover-footer {
        margin-top: 24px !important;
        padding-top: 16px !important;
        border-top: 1px solid rgba(0, 0, 0, 0.05) !important;
        display: flex !important;
        gap: 8px !important;
        justify-content: flex-end !important;
      }

      .dark .driver-popover-footer {
        border-top-color: rgba(255, 255, 255, 0.05) !important;
      }

      .driver-media-container {
        width: 100%;
        margin-bottom: 12px;
      }
      
      .driver-media-container img, .driver-media-container video {
        width: 100%;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      /* Arrow styling */
      .driver-popover-arrow {
        border-color: rgba(255, 255, 255, 0.85) !important;
      }
      .dark .driver-popover-arrow {
        border-color: rgba(15, 23, 42, 0.85) !important;
      }
    `}</style>
  );
}
