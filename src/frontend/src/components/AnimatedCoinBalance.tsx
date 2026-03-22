import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
}

export function AnimatedCoinBalance({ value }: Props) {
  const [displayed, setDisplayed] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    prevRef.current = value;
    if (start === end) return;
    const duration = 500;
    const startTime = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setDisplayed(Math.round(start + (end - start) * ease));
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return (
    <span
      className="font-black leading-none"
      style={{
        fontSize: "clamp(56px, 15vw, 96px)",
        color: "var(--unrot-text)",
        letterSpacing: "-0.02em",
      }}
    >
      {displayed.toLocaleString()}
    </span>
  );
}
