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
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(parseFloat((eased * value).toFixed(1)));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [value]);

  return (
    <div
      className={`p-5 rounded-[4px] border transition-all duration-300 ${
        emphasis
          ? "border-brown bg-brown/5 shadow-sm"
          : "border-rule-strong bg-surface-1 hover:border-brown/40 shadow-sm"
      }`}
    >
      <p className="text-[12px] text-text-tertiary mb-1 font-medium">{label}</p>
      <p
        className={`text-4xl font-mono tracking-tight leading-none ${
          emphasis ? "text-brown" : "text-blue"
        }`}
      >
        {displayed}
      </p>
    </div>
  );
}
