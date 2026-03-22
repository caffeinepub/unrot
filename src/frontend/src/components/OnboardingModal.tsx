import { useState } from "react";
import { haptic } from "../utils/haptics";

interface Props {
  onDone: () => void;
}

const slides = [
  {
    icon: "🪙",
    title: "Earn Coins",
    desc: "Complete real-world tasks — like push-ups and sit-ups — to earn coins. Every rep counts!",
  },
  {
    icon: "📱",
    title: "Spend Coins",
    desc: "Redeem your coins for screen time or custom rewards like watching a movie or gaming sessions.",
  },
  {
    icon: "💪",
    title: "Stay Disciplined",
    desc: "Reduce wasted screen time, build healthy habits, and reward yourself for real effort.",
  },
];

export default function OnboardingModal({ onDone }: Props) {
  const [step, setStep] = useState(0);

  const next = () => {
    haptic();
    if (step < slides.length - 1) setStep(step + 1);
    else onDone();
  };

  const slide = slides[step];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-md rounded-t-3xl p-8 animate-slide-up"
        style={{
          background: "var(--unrot-card)",
          border: "1px solid var(--unrot-border)",
        }}
      >
        <div className="flex justify-center mb-6">
          <span className="text-7xl">{slide.icon}</span>
        </div>
        <h2
          className="text-2xl font-bold text-center mb-3"
          style={{ color: "var(--unrot-text)" }}
        >
          {slide.title}
        </h2>
        <p
          className="text-center text-base leading-relaxed"
          style={{ color: "var(--unrot-muted)" }}
        >
          {slide.desc}
        </p>

        <div className="flex justify-center gap-2 my-6">
          {slides.map((s) => (
            <div
              key={s.title}
              className="rounded-full transition-all"
              style={{
                width: slides.indexOf(s) === step ? 24 : 8,
                height: 8,
                background:
                  slides.indexOf(s) === step
                    ? "var(--unrot-green)"
                    : "var(--unrot-border)",
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          className="w-full py-4 rounded-2xl font-bold text-base unrot-btn-green"
        >
          {step < slides.length - 1 ? "Next" : "Get Started 🚀"}
        </button>
      </div>
    </div>
  );
}
