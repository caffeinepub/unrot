import { useEffect, useRef, useState } from "react";
import type { Task } from "../backend.d";
import { haptic } from "../utils/haptics";

interface Props {
  task: Task;
  onComplete: () => void;
  onClose: () => void;
}

export default function PushupCounterModal({
  task,
  onComplete,
  onClose,
}: Props) {
  const target = Number(task.targetReps) || 10;
  const [reps, setReps] = useState(0);
  const [done, setDone] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleTap = () => {
    if (done) return;
    haptic();
    const next = reps + 1;
    setReps(next);
    if (next >= target) {
      setDone(true);
      setTimeout(() => onComplete(), 800);
    }
  };

  const pct = Math.min((reps / target) * 100, 100);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)" }}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
      >
        ✕
      </button>

      <div className="flex flex-col items-center gap-8 px-8 w-full max-w-sm">
        {/* Title */}
        <div className="text-center">
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: "var(--unrot-muted)" }}
          >
            {task.title}
          </p>
          <p className="text-xs" style={{ color: "var(--unrot-dim)" }}>
            Tap the button each time your nose touches the screen
          </p>
        </div>

        {/* Rep counter */}
        <div className="text-center">
          <p
            className="font-black leading-none"
            style={{
              fontSize: "6rem",
              color: done ? "var(--unrot-green)" : "var(--unrot-text)",
              transition: "color 0.2s",
            }}
          >
            {reps}
          </p>
          <p className="text-base mt-1" style={{ color: "var(--unrot-muted)" }}>
            of {target} reps
          </p>
        </div>

        {/* Progress bar */}
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${pct}%`,
              background: done ? "#2ECC71" : "var(--unrot-green)",
            }}
          />
        </div>

        {/* Big tap button */}
        {!done ? (
          <button
            ref={btnRef}
            type="button"
            onClick={handleTap}
            className="w-48 h-48 rounded-full flex flex-col items-center justify-center font-bold text-white select-none transition-all active:scale-90"
            style={{
              background: "linear-gradient(135deg, #2ECC71, #27ae60)",
              boxShadow:
                "0 0 60px rgba(46,204,113,0.4), 0 8px 32px rgba(0,0,0,0.4)",
              fontSize: "1.1rem",
              userSelect: "none",
              WebkitUserSelect: "none",
              touchAction: "manipulation",
            }}
          >
            <span style={{ fontSize: "2.5rem" }}>💪</span>
            <span className="mt-1">TAP</span>
            <span
              className="text-xs font-normal mt-0.5"
              style={{ opacity: 0.8 }}
            >
              = 1 push-up
            </span>
          </button>
        ) : (
          <div
            className="w-48 h-48 rounded-full flex flex-col items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #2ECC71, #27ae60)",
              boxShadow: "0 0 60px rgba(46,204,113,0.5)",
            }}
          >
            <span style={{ fontSize: "3rem" }}>🎉</span>
            <span className="text-white font-bold mt-1">Done!</span>
          </div>
        )}

        {/* Coin reward */}
        <p className="text-sm" style={{ color: "var(--unrot-green)" }}>
          +{task.coinReward.toString()} 🪙 on completion
        </p>

        {/* Skip */}
        {!done && (
          <button
            type="button"
            onClick={onComplete}
            className="text-sm py-2 px-6 rounded-full"
            style={{
              color: "var(--unrot-dim)",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            Skip &amp; Complete
          </button>
        )}
      </div>
    </div>
  );
}
