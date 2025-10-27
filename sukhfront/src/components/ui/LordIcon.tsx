"use client";

import { useEffect } from "react";

type LordIconProps = {
  src: string;
  trigger?: "hover" | "click" | "loop" | "morph" | string;
  colors?: string; // e.g. "primary:#ffffff,secondary:#000000"
  size?: number | string; // applied to width/height
  stroke?: string | number; // "bold", "light" or number
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  /** additional attributes passed directly */
  [key: string]: any;
};

export function LordIcon({
  src,
  trigger = "hover",
  colors,
  size = 24,
  stroke = "bold",
  className,
  style,
  onClick,
  ...rest
}: LordIconProps) {
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Register the custom element once on client
        if (!customElements.get("lord-icon")) {
          const [lordIconMod, lottieMod] = await Promise.all([
            import("lord-icon-element"),
            import("lottie-web"),
          ]);
          const define =
            (lordIconMod as any).defineElement ||
            (lordIconMod as any).defineLordIconElement;
          const lottieAny: any =
            (lottieMod as any).default || (lottieMod as any);
          if (
            mounted &&
            typeof define === "function" &&
            lottieAny?.loadAnimation
          ) {
            define(lottieAny.loadAnimation);
          }
        }
      } catch (e) {
        // no-op if failed; component will simply not render animated icon
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const dim = typeof size === "number" ? `${size}px` : size;

  return (
    // @ts-ignore - custom element typings provided in global d.ts
    <lord-icon
      src={src}
      trigger={trigger}
      colors={colors}
      stroke={String(stroke)}
      style={{
        width: dim,
        height: dim,
        display: "inline-block",
        verticalAlign: "middle",
        ...style,
      }}
      class={className}
      onClick={onClick as any}
      {...rest}
    />
  );
}

export default LordIcon;
