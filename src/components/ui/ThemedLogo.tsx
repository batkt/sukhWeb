"use client";

import Image from "next/image";
import React from "react";

type ThemedLogoProps = {
  size?: number;
  className?: string;
  alt?: string;
  IconComponent?: React.FC<React.SVGProps<SVGSVGElement>>;
  lightSrc?: string;
  darkSrc?: string;
  withBg?: boolean;
  bgStrength?: "weak" | "default" | "strong";
  bgMode?: "theme" | "tint";
  radius?: number;
  padding?: number;
  style?: React.CSSProperties;
};

export default function ThemedLogo({
  size = 48,
  className,
  alt = "Logo",
  IconComponent,
  lightSrc = "/logoSukh.png",
  darkSrc,
  withBg = true,
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
    background: withBg ? "#000" : undefined,
    border: withBg ? "1px solid rgba(255,255,255,0.06)" : undefined,
    boxShadow: withBg ? "0 8px 20px var(--glass-shadow)" : undefined,
    ...style,
  };

  return (
    <span className={`${className || ""} themed-logo-bg`} style={wrapperStyle}>
      {IconComponent ? (
        <span style={{ color: "var(--panel-text)", lineHeight: 0 }}>
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

      {/* Logo background is always black, not theme-dependent */}
    </span>
  );
}
