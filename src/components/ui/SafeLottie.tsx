"use client";

import React, { useEffect, useRef } from "react";
import lottie, { type AnimationItem } from "lottie-web";

interface SafeLottieProps {
  src?: string;
  animationData?: any;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Lightweight, crash-proof Lottie animation component using lottie-web SVG renderer.
 * Unlike @lottiefiles/dotlottie-react, this does NOT use WebAssembly or ThorVG WebGL canvas,
 * preventing WebKit WebContent process crashes on Safari / macOS / iOS.
 */
export default function SafeLottie({
  src,
  animationData,
  loop = true,
  autoplay = true,
  className,
  style,
}: SafeLottieProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const init = async () => {
      if (!containerRef.current) return;

      try {
        let animData = animationData;
        if (!animData && src) {
          const res = await fetch(src);
          if (!res.ok) return;
          animData = await res.json();
        }

        if (isCancelled || !containerRef.current || !animData) return;

        // Clean up previous instance before creating new one
        if (animRef.current) {
          animRef.current.destroy();
          animRef.current = null;
        }

        animRef.current = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop,
          autoplay,
          animationData: animData,
        });
      } catch (err) {
        console.error("SafeLottie load error:", err);
      }
    };

    init();

    return () => {
      isCancelled = true;
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, [src, animationData, loop, autoplay]);

  return <div ref={containerRef} className={className} style={style} />;
}
