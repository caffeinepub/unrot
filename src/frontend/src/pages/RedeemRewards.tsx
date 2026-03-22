import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Reward, UserProfile, backendInterface } from "../backend.d";
import { haptic } from "../utils/haptics";

interface Props {
  actor: backendInterface | null;
  profile: UserProfile | null;
  onRefreshProfile: () => Promise<void>;
}

type ConfirmItem =
  | {
      kind: "screentime";
      label: string;
      icon: string;
      minutes: number;
      coins: number;
    }
  | { kind: "reward"; reward: Reward };

const SCREEN_TIME_OPTIONS = [
  { label: "15 minutes", icon: "⏱️", minutes: 15, coins: 15 },
  { label: "1 hour", icon: "🕐", minutes: 60, coins: 60 },
  { label: "All Day", icon: "☀️", minutes: 1440, coins: 1440 },
];

export default function RedeemRewards({
  actor,
  profile,
  onRefreshProfile,
}: Props) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCost, setNewCost] = useState("");
  const [confirmItem, setConfirmItem] = useState<ConfirmItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const balance = profile ? Number(profile.coinBalance) : 0;
  const debtBlocked = balance <= -20;

  const loadRewards = useCallback(async () => {
    if (!actor) return;
    try {
      const r = await actor.getRewards();
      setRewards(r);
    } catch {
      toast.error("Failed to load rewards");
    } finally {
      setLoadingRewards(false);
    }
  }, [actor]);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  const handleConfirm = async () => {
    if (!confirmItem || !actor) return;
    haptic();
    setActionLoading(true);
    try {
      if (confirmItem.kind === "screentime") {
        await actor.redeemScreenTime(BigInt(confirmItem.minutes));
        toast.success(`${confirmItem.label} redeemed! 🎉`, { duration: 2500 });
        await onRefreshProfile();
      } else {
        await actor.redeemCustomReward(confirmItem.reward.id);
        toast.success(`"${confirmItem.reward.name}" redeemed! 🎉`);
        await Promise.all([loadRewards(), onRefreshProfile()]);
      }
      setConfirmItem(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Redemption failed");
    } finally {
      setActionLoading(false);
    }
  };

  const addReward = async () => {
    if (!actor || !newName.trim() || !newCost) return;
    haptic();
    try {
      await actor.addReward(newName.trim(), BigInt(Number.parseInt(newCost)));
      toast.success("Reward created!");
      setNewName("");
      setNewCost("");
      setShowAddForm(false);
      await loadRewards();
    } catch {
      toast.error("Failed to add reward");
    }
  };

  const deleteReward = async (id: bigint) => {
    if (!actor) return;
    haptic();
    if (!window.confirm("Delete this reward?")) return;
    try {
      await actor.deleteReward(id);
      toast.success("Reward deleted");
      await loadRewards();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const confirmLabel =
    confirmItem?.kind === "screentime"
      ? confirmItem.label
      : confirmItem?.kind === "reward"
        ? confirmItem.reward.name
        : "";
  const confirmCoins =
    confirmItem?.kind === "screentime"
      ? confirmItem.coins
      : confirmItem?.kind === "reward"
        ? Number(confirmItem.reward.coinCost)
        : 0;
  const confirmIcon =
    confirmItem?.kind === "screentime" ? confirmItem.icon : "🎁";

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto animate-fade-in">
      {/* Balance chip */}
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
        style={{
          background: "rgba(46,204,113,0.12)",
          border: "1px solid rgba(46,204,113,0.25)",
        }}
      >
        <span className="text-lg coin-glow">🪙</span>
        <span
          className="font-bold text-base"
          style={{
            color: balance >= 0 ? "var(--unrot-green)" : "var(--unrot-red)",
          }}
        >
          {balance} coins
        </span>
      </div>

      {debtBlocked && (
        <div
          className="rounded-2xl p-3 mb-5 flex items-center gap-2"
          style={{
            background: "rgba(224,107,90,0.15)",
            border: "1px solid rgba(224,107,90,0.4)",
          }}
        >
          <span>🚫</span>
          <p className="text-sm font-semibold" style={{ color: "#E06B5A" }}>
            Debt limit reached. Complete tasks first!
          </p>
        </div>
      )}

      {/* ── Screen Time Section ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-1">
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--unrot-text)" }}
          >
            Screen Time
          </h2>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--unrot-muted)" }}>
          1 coin = 1 minute of screen time
        </p>

        <div className="flex flex-col gap-3">
          {SCREEN_TIME_OPTIONS.map(({ label, icon, minutes, coins }) => {
            const canAfford = !debtBlocked && balance - coins >= -20;
            return (
              <button
                type="button"
                key={label}
                data-ocid={`store.${label.replace(/ /g, "_").toLowerCase()}.button`}
                onClick={() => {
                  if (!canAfford) return;
                  haptic();
                  setConfirmItem({
                    kind: "screentime",
                    label,
                    icon,
                    minutes,
                    coins,
                  });
                }}
                disabled={!canAfford}
                className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all glass-card"
                style={{
                  opacity: canAfford ? 1 : 0.45,
                  cursor: canAfford ? "pointer" : "not-allowed",
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: "rgba(46,204,113,0.12)" }}
                >
                  {icon}
                </div>
                <div className="flex-1">
                  <p
                    className="font-bold text-base"
                    style={{ color: "var(--unrot-text)" }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--unrot-muted)" }}
                  >
                    {minutes < 60
                      ? `${minutes} min`
                      : minutes === 60
                        ? "60 min"
                        : "Full day (1440 min)"}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span
                    className="font-bold text-lg"
                    style={{ color: "var(--unrot-gold)" }}
                  >
                    {coins}
                  </span>
                  <span className="text-lg">🪙</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── My Rewards Section ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--unrot-text)" }}
          >
            My Rewards
          </h2>
          <button
            type="button"
            data-ocid="store.rewards.open_modal_button"
            onClick={() => {
              haptic();
              setShowAddForm(!showAddForm);
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl"
            style={{
              background: showAddForm
                ? "rgba(255,255,255,0.08)"
                : "rgba(46,204,113,0.15)",
              color: showAddForm ? "var(--unrot-muted)" : "var(--unrot-green)",
              border: "1px solid",
              borderColor: showAddForm
                ? "rgba(255,255,255,0.1)"
                : "rgba(46,204,113,0.3)",
            }}
          >
            {showAddForm ? "Cancel" : "+ Add"}
          </button>
        </div>

        {/* Add reward form */}
        {showAddForm && (
          <div className="rounded-2xl p-4 mb-4 animate-slide-up glass-card">
            <p
              className="font-bold mb-3"
              style={{ color: "var(--unrot-text)" }}
            >
              New Reward
            </p>
            <div className="flex flex-col gap-3">
              <input
                data-ocid="store.reward_name.input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Watch a movie 🎬"
                className="px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--unrot-text)",
                  outline: "none",
                }}
              />
              <input
                data-ocid="store.reward_cost.input"
                type="number"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                placeholder="Coin cost"
                min="1"
                className="px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--unrot-text)",
                  outline: "none",
                }}
              />
              <button
                type="button"
                data-ocid="store.reward.submit_button"
                onClick={addReward}
                disabled={!newName.trim() || !newCost}
                className="unrot-btn-green py-2.5 text-sm"
              >
                Create Reward
              </button>
            </div>
          </div>
        )}

        {/* Rewards list */}
        {loadingRewards ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl animate-pulse"
                style={{ background: "var(--unrot-card)" }}
              />
            ))}
          </div>
        ) : rewards.length === 0 ? (
          <div
            data-ocid="store.rewards.empty_state"
            className="rounded-2xl p-10 text-center glass-card"
          >
            <p className="text-4xl mb-3">🎁</p>
            <p className="text-sm" style={{ color: "var(--unrot-muted)" }}>
              No rewards yet. Create your first custom reward!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rewards.map((r, idx) => {
              const cost = Number(r.coinCost);
              const canAfford = !debtBlocked && balance - cost >= -20;
              return (
                <div
                  key={r.id.toString()}
                  data-ocid={`store.rewards.item.${idx + 1}`}
                  className="flex items-center gap-3 p-4 rounded-2xl glass-card"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "rgba(245,200,75,0.12)" }}
                  >
                    🎁
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold truncate"
                      style={{ color: "var(--unrot-text)" }}
                    >
                      {r.name}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--unrot-gold)" }}
                    >
                      {cost} 🪙
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-ocid={`store.rewards.redeem_button.${idx + 1}`}
                      onClick={() => {
                        if (!canAfford) return;
                        haptic();
                        setConfirmItem({ kind: "reward", reward: r });
                      }}
                      disabled={!canAfford}
                      className="text-xs px-3 py-2 rounded-xl font-semibold transition-all"
                      style={{
                        background: canAfford
                          ? "rgba(46,204,113,0.15)"
                          : "rgba(255,255,255,0.05)",
                        color: canAfford
                          ? "var(--unrot-green)"
                          : "var(--unrot-dim)",
                        border: "1px solid",
                        borderColor: canAfford
                          ? "rgba(46,204,113,0.3)"
                          : "rgba(255,255,255,0.08)",
                        opacity: canAfford ? 1 : 0.5,
                      }}
                    >
                      Redeem
                    </button>
                    <button
                      type="button"
                      data-ocid={`store.rewards.delete_button.${idx + 1}`}
                      onClick={() => deleteReward(r.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                      style={{
                        background: "rgba(224,107,90,0.12)",
                        color: "#E06B5A",
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Confirmation Sheet ── */}
      {confirmItem && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={(e) => e.target === e.currentTarget && setConfirmItem(null)}
          onKeyDown={(e) => e.key === "Escape" && setConfirmItem(null)}
        >
          <div
            data-ocid="store.confirm.dialog"
            className="w-full max-w-md rounded-t-3xl p-6 animate-slide-up glass-modal"
          >
            <div className="text-center mb-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3"
                style={{ background: "rgba(46,204,113,0.12)" }}
              >
                {confirmIcon}
              </div>
              <h3
                className="text-xl font-bold mb-1"
                style={{ color: "var(--unrot-text)" }}
              >
                Redeem {confirmLabel}?
              </h3>
              <p style={{ color: "var(--unrot-muted)" }} className="text-sm">
                This will cost you{" "}
                <span
                  className="font-bold"
                  style={{ color: "var(--unrot-gold)" }}
                >
                  {confirmCoins} coins
                </span>
              </p>
              <p
                className="text-xs mt-1"
                style={{
                  color:
                    balance - confirmCoins < 0
                      ? "var(--unrot-red)"
                      : "var(--unrot-muted)",
                }}
              >
                Balance after: {balance - confirmCoins} 🪙
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                data-ocid="store.confirm.cancel_button"
                onClick={() => {
                  haptic();
                  setConfirmItem(null);
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
                data-ocid="store.confirm.confirm_button"
                onClick={handleConfirm}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm unrot-btn-green"
              >
                {actionLoading ? "Redeeming..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
