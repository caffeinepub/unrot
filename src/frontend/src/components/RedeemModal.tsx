import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Reward, UserProfile, backendInterface } from "../backend.d";
import { haptic } from "../utils/haptics";

interface Props {
  actor: backendInterface | null;
  profile: UserProfile | null;
  onClose: () => void;
  onRefreshProfile: () => Promise<void>;
}

type View = "main" | "screentime" | "rewards";

const DEBT_LIMIT = -15;

export default function RedeemModal({
  actor,
  profile,
  onClose,
  onRefreshProfile,
}: Props) {
  const [view, setView] = useState<View>("main");
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<{
    label: string;
    mins: number;
  } | null>(null);
  const balance = profile ? Number(profile.coinBalance) : 0;
  const debtLocked = balance <= DEBT_LIMIT;

  useEffect(() => {
    if (view === "rewards" && actor) {
      actor
        .getRewards()
        .then(setRewards)
        .catch(() => {});
    }
  }, [view, actor]);

  const redeemScreenTime = async (minutes: number, label: string) => {
    if (!actor) return;
    if (debtLocked) {
      toast.error("Debt limit reached. Complete tasks to earn coins first!");
      return;
    }
    const cost = minutes;
    if (balance - cost < DEBT_LIMIT) {
      toast.error(
        "Not enough coins. This would exceed your -15 coin debt limit.",
      );
      return;
    }
    haptic();
    setLoading(label);
    try {
      await actor.redeemScreenTime(BigInt(minutes));
      toast.success(`${label} redeemed! Enjoy 🎉`, { duration: 2500 });
      await onRefreshProfile();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Redemption failed");
    } finally {
      setLoading(null);
      setConfirming(null);
    }
  };

  const redeemCustomReward = async (reward: Reward) => {
    if (!actor) return;
    if (debtLocked) {
      toast.error("Debt limit reached. Complete tasks to earn coins first!");
      return;
    }
    if (balance - Number(reward.coinCost) < DEBT_LIMIT) {
      toast.error(
        "Not enough coins. This would exceed your -15 coin debt limit.",
      );
      return;
    }
    haptic();
    setLoading(reward.id.toString());
    try {
      await actor.redeemCustomReward(reward.id);
      toast.success(`"${reward.name}" redeemed! 🎉`, { duration: 2500 });
      await onRefreshProfile();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Redemption failed");
    } finally {
      setLoading(null);
    }
  };

  const screenTimeOptions = [
    { label: "15 minutes", mins: 15, icon: "⏱️", cost: 15 },
    { label: "1 hour", mins: 60, icon: "🕐", cost: 60 },
    { label: "All Day", mins: 1440, icon: "☀️", cost: 1440 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="w-full max-w-md rounded-t-3xl px-5 pt-5 pb-8 glass-modal animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {view !== "main" && (
              <button
                type="button"
                onClick={() => {
                  haptic();
                  setView("main");
                  setConfirming(null);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm mr-1"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "var(--unrot-text)",
                }}
              >
                ←
              </button>
            )}
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--unrot-text)" }}
            >
              {view === "main"
                ? "Redeem"
                : view === "screentime"
                  ? "Screen Time"
                  : "Rewards"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "var(--unrot-text)",
            }}
          >
            ✕
          </button>
        </div>

        {/* Balance pill */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-2xl mb-4 w-fit"
          style={{
            background: debtLocked
              ? "rgba(224,107,90,0.12)"
              : "rgba(46,204,113,0.12)",
            border: debtLocked
              ? "1px solid rgba(224,107,90,0.3)"
              : "1px solid rgba(46,204,113,0.2)",
          }}
        >
          <span className="text-lg">🪙</span>
          <span
            className="text-base font-bold"
            style={{ color: debtLocked ? "#E06B5A" : "var(--unrot-green)" }}
          >
            {balance} coins
          </span>
        </div>

        {/* Debt locked banner */}
        {debtLocked && (
          <div
            className="rounded-2xl p-3 mb-4 flex items-center gap-2"
            style={{
              background: "rgba(224,107,90,0.12)",
              border: "1px solid rgba(224,107,90,0.3)",
            }}
          >
            <span>🚫</span>
            <p className="text-sm font-medium" style={{ color: "#E06B5A" }}>
              Debt limit reached (-15). Complete tasks first!
            </p>
          </div>
        )}

        {/* Main view */}
        {view === "main" && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                haptic();
                setView("screentime");
              }}
              className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-95"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span className="text-3xl">📱</span>
              <div className="flex-1">
                <p className="font-bold" style={{ color: "var(--unrot-text)" }}>
                  Screen Time
                </p>
                <p className="text-xs" style={{ color: "var(--unrot-muted)" }}>
                  Convert coins to free screen time
                </p>
              </div>
              <span style={{ color: "var(--unrot-dim)" }}>›</span>
            </button>
            <button
              type="button"
              onClick={() => {
                haptic();
                setView("rewards");
              }}
              className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-95"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span className="text-3xl">🎁</span>
              <div className="flex-1">
                <p className="font-bold" style={{ color: "var(--unrot-text)" }}>
                  Rewards
                </p>
                <p className="text-xs" style={{ color: "var(--unrot-muted)" }}>
                  Spend coins on custom rewards
                </p>
              </div>
              <span style={{ color: "var(--unrot-dim)" }}>›</span>
            </button>
          </div>
        )}

        {/* Screen time view */}
        {view === "screentime" && !confirming && (
          <div className="flex flex-col gap-3">
            {screenTimeOptions.map(({ label, mins, icon, cost }) => {
              const canAfford = balance - cost >= DEBT_LIMIT;
              return (
                <button
                  type="button"
                  key={label}
                  onClick={() => {
                    if (!canAfford) {
                      toast.error("Not enough coins for this option.");
                      return;
                    }
                    haptic();
                    setConfirming({ label, mins });
                  }}
                  disabled={loading !== null}
                  className="flex items-center justify-between p-4 rounded-2xl transition-all active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    opacity: !canAfford || loading !== null ? 0.4 : 1,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{icon}</span>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--unrot-text)" }}
                    >
                      {label}
                    </span>
                  </div>
                  <span
                    className="text-sm font-bold"
                    style={{ color: "var(--unrot-green)" }}
                  >
                    {cost} 🪙
                  </span>
                </button>
              );
            })}
            <p
              className="text-center text-xs mt-2 px-2"
              style={{ color: "var(--unrot-dim)" }}
            >
              You can always spend now, and earn later, but 15 coins max
            </p>
          </div>
        )}

        {/* Confirmation */}
        {view === "screentime" && confirming && (
          <div className="flex flex-col items-center gap-5">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{
                background: "rgba(46,204,113,0.15)",
                border: "2px solid rgba(46,204,113,0.3)",
              }}
            >
              {confirming.label === "All Day"
                ? "☀️"
                : confirming.mins === 15
                  ? "⏱️"
                  : "🕐"}
            </div>
            <div className="text-center">
              <p
                className="text-xl font-bold mb-1"
                style={{ color: "var(--unrot-text)" }}
              >
                Confirm Redemption
              </p>
              <p className="text-sm" style={{ color: "var(--unrot-muted)" }}>
                Use {confirming.mins} coins for {confirming.label} of screen
                time?
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  haptic();
                  setConfirming(null);
                }}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "var(--unrot-text)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  redeemScreenTime(confirming.mins, confirming.label)
                }
                disabled={loading !== null}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm unrot-btn-green"
              >
                {loading ? "Redeeming..." : "Confirm"}
              </button>
            </div>
            <p
              className="text-center text-xs px-4"
              style={{ color: "var(--unrot-dim)" }}
            >
              You can always spend now, and earn later, but 15 coins max
            </p>
          </div>
        )}

        {/* Rewards view */}
        {view === "rewards" && (
          <div className="flex flex-col gap-3">
            {rewards.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🎁</p>
                <p className="text-sm" style={{ color: "var(--unrot-muted)" }}>
                  No custom rewards yet. Add some in Settings!
                </p>
              </div>
            ) : (
              rewards.map((reward) => {
                const canAfford =
                  balance - Number(reward.coinCost) >= DEBT_LIMIT;
                return (
                  <button
                    type="button"
                    key={reward.id.toString()}
                    onClick={() => redeemCustomReward(reward)}
                    disabled={loading !== null || !canAfford}
                    className="flex items-center justify-between p-4 rounded-2xl transition-all active:scale-95"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      opacity: !canAfford ? 0.4 : 1,
                    }}
                  >
                    <span
                      className="font-semibold"
                      style={{ color: "var(--unrot-text)" }}
                    >
                      {reward.name}
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: "var(--unrot-gold)" }}
                    >
                      {reward.coinCost.toString()} 🪙
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
