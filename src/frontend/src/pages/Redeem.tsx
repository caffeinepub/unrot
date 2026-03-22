import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile, backendInterface } from "../backend.d";
import { haptic } from "../utils/haptics";

interface Props {
  actor: backendInterface | null;
  profile: UserProfile | null;
  onRefreshProfile: () => Promise<void>;
}

export default function Redeem({ actor, profile, onRefreshProfile }: Props) {
  const [customMins, setCustomMins] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const balance = profile ? Number(profile.coinBalance) : 0;
  const debtBlocked = balance <= -20;

  const redeemTime = async (minutes: number, label: string) => {
    if (!actor) return;
    haptic();
    if (balance - minutes < -20) {
      toast.error("Not enough coins! Would exceed debt limit.");
      return;
    }
    setLoading(label);
    try {
      await actor.redeemScreenTime(BigInt(minutes));
      toast.success(`${label} redeemed! Enjoy 🎉`, { duration: 2500 });
      await onRefreshProfile();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Redemption failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto animate-fade-in">
      <h1
        className="text-2xl font-bold mb-2"
        style={{ color: "var(--unrot-text)" }}
      >
        Redeem
      </h1>

      {/* Balance */}
      <div
        className="rounded-2xl p-4 mb-6 flex items-center justify-between"
        style={{
          background: "var(--unrot-card)",
          border: "1px solid var(--unrot-border)",
        }}
      >
        <div>
          <p className="text-xs" style={{ color: "var(--unrot-muted)" }}>
            Current Balance
          </p>
          <p
            className="text-3xl font-bold"
            style={{
              color: balance >= 0 ? "var(--unrot-green)" : "var(--unrot-red)",
            }}
          >
            {balance}
          </p>
        </div>
        <span className="text-4xl coin-glow">🪙</span>
      </div>

      {debtBlocked && (
        <div
          className="rounded-2xl p-3 mb-4"
          style={{
            background: "rgba(224,107,90,0.15)",
            border: "1px solid rgba(224,107,90,0.4)",
          }}
        >
          <p className="text-sm font-semibold" style={{ color: "#E06B5A" }}>
            🚫 Debt limit reached. Complete tasks first!
          </p>
        </div>
      )}

      <h2
        className="text-base font-bold mb-3"
        style={{ color: "var(--unrot-text)" }}
      >
        Screen Time
      </h2>
      <p className="text-xs mb-4" style={{ color: "var(--unrot-muted)" }}>
        1 coin = 1 minute of screen time
      </p>

      <div className="flex flex-col gap-3 mb-6">
        {[
          { label: "15 minutes", mins: 15, icon: "⏱️" },
          { label: "1 hour", mins: 60, icon: "🕐" },
        ].map(({ label, mins, icon }) => (
          <button
            type="button"
            key={label}
            onClick={() => redeemTime(mins, label)}
            disabled={debtBlocked || loading !== null || balance - mins < -20}
            className="flex items-center justify-between p-4 rounded-2xl font-semibold transition-all"
            style={{
              background: "var(--unrot-card)",
              border: "1px solid var(--unrot-border)",
              color: "var(--unrot-text)",
              opacity: debtBlocked || balance - mins < -20 ? 0.4 : 1,
            }}
          >
            <span>
              {icon} {label}
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: "var(--unrot-green)" }}
            >
              {mins} 🪙
            </span>
          </button>
        ))}

        {/* All Day / Custom */}
        <div
          className="p-4 rounded-2xl"
          style={{
            background: "var(--unrot-card)",
            border: "1px solid var(--unrot-border)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="font-semibold"
              style={{ color: "var(--unrot-text)" }}
            >
              ☀️ Custom Duration
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={customMins}
              onChange={(e) => setCustomMins(e.target.value)}
              placeholder="Minutes"
              min="1"
              className="flex-1 px-3 py-2 rounded-xl text-sm"
              style={{
                background: "var(--unrot-bg)",
                border: "1px solid var(--unrot-border)",
                color: "var(--unrot-text)",
              }}
            />
            <button
              type="button"
              onClick={() => {
                const m = Number.parseInt(customMins);
                if (m > 0) redeemTime(m, `${m} minutes`);
              }}
              disabled={
                !customMins ||
                Number.parseInt(customMins) <= 0 ||
                debtBlocked ||
                loading !== null
              }
              className="px-4 py-2 rounded-xl font-semibold text-sm unrot-btn-green"
              style={{ minWidth: 70 }}
            >
              {loading?.includes("minutes") ? "..." : "Redeem"}
            </button>
          </div>
          {customMins && Number.parseInt(customMins) > 0 && (
            <p className="text-xs mt-2" style={{ color: "var(--unrot-muted)" }}>
              Cost: {customMins} 🪙
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
