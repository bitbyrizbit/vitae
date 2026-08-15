"use client";

import { useEffect, useState } from "react";

type Props = {
  label: string;
  value: number;
  emphasis?: boolean;
};

export function ScoreCard({ label, value, emphasis = false }: Props) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayed(0);
      return;
    }
    const duration = 700;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(parseFloat((eased * value).toFixed(1)));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [value]);

  return (
    <div
      className={`p-5 rounded-[3px] border transition-all duration-300 ${
        emphasis
          ? "border-gold/40 bg-surface-2"
          : "border-rule-subtle bg-surface-1 hover:border-rule"
      }`}
    >
      <p className="text-[11px] text-text-tertiary mb-2 font-mono">{label}</p>
      <p
        className={`text-[32px] font-mono tracking-tight leading-none ${
          emphasis ? "text-gold" : "text-text"
        }`}
      >
        {displayed}
      </p>
    </div>
  );
}
