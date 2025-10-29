"use client";

import Image from "next/image";
import React from "react";

type ThemedLogoProps = {
  size?: number; // px
  className?: string;
  alt?: string;
  /** Inline SVG React component. When provided it will be rendered inline and colored via CSS color/currentColor. */
  IconComponent?: React.FC<React.SVGProps<SVGSVGElement>>;
  // Paths to light/dark assets under public/
  lightSrc?: string; // defaults to "/logo.svg"
  darkSrc?: string; // optional; if omitted, only lightSrc is rendered
  withBg?: boolean; // show theme-aware background using theme tokens
  /**
   * Background tint strength for light themes.
   * - "weak": least gray (subtle)
   * - "default": balanced (recommended)
   * - "strong": more gray for high contrast
   */
  bgStrength?: "weak" | "default" | "strong";
  /**
   * Background mode:
   * - "theme" (default): follow theme surface exactly (var(--surface-bg))
   * - "tint": use light-theme tints (weak/default/strong) for extra contrast
   */
  bgMode?: "theme" | "tint";
  radius?: number; // px
  padding?: number; // px
  style?: React.CSSProperties;
};

/**
 * Theme-aware logo with optional background that follows app theme tokens.
 * If darkSrc is provided, it swaps between .logo-light and .logo-dark based on
 * [data-theme="dark-black"].
 */
export default function ThemedLogo({
  size = 48,
  className,
  alt = "Logo",
  IconComponent,
  lightSrc = "/logoSukh.png",
  darkSrc,
  withBg = true,
  bgStrength = "strong",
  bgMode = "tint",
  radius = 12,
  padding = 6,
  style,
}: ThemedLogoProps) {
  const dim = size;
  const wrapperStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: withBg ? radius : undefined,
    padding: withBg ? padding : 0,
    // Use a CSS variable for the effective logo background so we can
    // control light vs dark behavior via theme selectors in global styles.
    background: withBg ? "var(--themed-logo-bg)" : undefined,
    border: withBg ? "1px solid var(--surface-border)" : undefined,
    // Subtle elevation so it reads on light backgrounds
    boxShadow: withBg ? "0 8px 20px var(--glass-shadow)" : undefined,
    ...style,
  };

  return (
    <span className={`${className || ""} themed-logo-bg`} style={wrapperStyle}>
      {IconComponent ? (
        // Render inline SVG so the glyph uses currentColor
        <span
          style={{ color: style?.color ?? "var(--panel-text)", lineHeight: 0 }}
        >
          <IconComponent width={dim} height={dim} />
        </span>
      ) : darkSrc ? (
        <>
          <span className="logo-variant logo-light">
            <Image src={lightSrc} alt={alt} width={dim} height={dim} priority />
          </span>
          <span className="logo-variant logo-dark">
            <Image src={darkSrc} alt={alt} width={dim} height={dim} priority />
          </span>
        </>
      ) : (
        <Image src={lightSrc} alt={alt} width={dim} height={dim} priority />
      )}

      <style jsx global>{`
        /* Variant swap rules (safe even if darkSrc is not provided) */
        .logo-variant.logo-dark {
          display: none;
        }
        /* Switch to dark variant on all dark themes */
        [data-theme="dark-black"] .logo-variant.logo-light,
        [data-theme="dark-gray"] .logo-variant.logo-light,
        [data-theme="dark-green"] .logo-variant.logo-light,
        .dark .logo-variant.logo-light {
          display: none;
        }
        [data-theme="dark-black"] .logo-variant.logo-dark,
        [data-theme="dark-gray"] .logo-variant.logo-dark,
        [data-theme="dark-green"] .logo-variant.logo-dark,
        .dark .logo-variant.logo-dark {
          display: inline-flex;
        }
        /* Default: on light themes make the logo background black so it reads well */
        .themed-logo-bg {
          --themed-logo-bg: #000;
        }
        /* On dark themes, let the logo follow the theme (use the primary/brand color)
           so it feels integrated. We prefer var(--primary) which is set per-theme. */
        [data-theme="dark-black"] .themed-logo-bg,
        [data-theme="dark-gray"] .themed-logo-bg,
        [data-theme="dark-green"] .themed-logo-bg,
        .dark .themed-logo-bg {
          --themed-logo-bg: var(--primary);
        }
      `}</style>
    </span>
  );
}
