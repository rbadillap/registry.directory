"use client";

import { useState, useEffect } from "react";

export function HeroTitle() {
  const [progress, setProgress] = useState(0);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    if (progress < 100) {
      const timeout = setTimeout(() => setProgress((p) => Math.min(p + 4, 100)), 20);
      return () => clearTimeout(timeout);
    } else if (!showBadge) {
      const timeout = setTimeout(() => setShowBadge(true), 200);
      return () => clearTimeout(timeout);
    }
  }, [progress, showBadge]);

  return (
    <h1 className="text-base font-medium font-mono relative">
      <span className="relative inline-flex">
        <span className="text-muted-foreground/30">
          registry<span>.directory</span>
        </span>
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
        >
          registry<span className="text-muted-foreground">.directory</span>
        </span>
        {progress < 100 && progress > 0 && (
          <span
            className="absolute top-0 bottom-0 w-px bg-foreground/60 shadow-[0_0_8px_2px_rgba(255,255,255,0.3)]"
            style={{ left: `${progress}%` }}
          />
        )}
      </span>{" "}
      <span
        className={`text-[10px] text-muted-foreground rounded-full border border-border px-1.5 py-0.5 font-normal uppercase tracking-widest align-middle transition-opacity duration-200 ease-out ${
          showBadge ? "opacity-100" : "opacity-0"
        }`}
      >
        beta
      </span>
    </h1>
  );
}
