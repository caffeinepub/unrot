import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Reward, UserProfile, backendInterface } from "../backend.d";
import { haptic } from "../utils/haptics";

interface Props {
  actor: backendInterface | null;
  profile: UserProfile | null;
  onRefreshProfile: () => Promise<void>;
}

export default function Rewards({ actor, profile, onRefreshProfile }: Props) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCost, setNewCost] = useState("");
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const balance = profile ? Number(profile.coinBalance) : 0;

  const load = useCallback(async () => {
    if (!actor) return;
    try {
      const r = await actor.getRewards();
      setRewards(r);
    } catch {
      toast.error("Failed to load rewards");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const addReward = async () => {
    if (!actor || !newName.trim() || !newCost) return;
    haptic();
    try {
      await actor.addReward(newName.trim(), BigInt(Number.parseInt(newCost)));
      toast.success("Reward created!");
      setNewName("");
      setNewCost("");
      setShowAdd(false);
      await load();
    } catch {
      toast.error("Failed to add reward");
    }
  };

  const deleteReward = async (id: bigint) => {
    if (!actor) return;
    haptic();
    try {
      await actor.deleteReward(id);
      toast.success("Reward deleted");
      await load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const redeemReward = async (reward: Reward) => {
    if (!actor) return;
    haptic();
    const cost = Number(reward.coinCost);
    if (balance - cost < -20) {
      toast.error("Not enough coins!");
      return;
    }
    setRedeeming(reward.id.toString());
    try {
      await actor.redeemCustomReward(reward.id);
      toast.success(`"${reward.name}" redeemed! 🎉`);
      await Promise.all([load(), onRefreshProfile()]);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to redeem");
    } finally {
      setRedeeming(null);
    }
  };

  const examples = ["Watch a movie 🎬", "Play games 🎮", "Snack break 🍿"];

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--unrot-text)" }}
        >
          Rewards
        </h1>
        <button
          type="button"
          onClick={() => {
            haptic();
            setShowAdd(!showAdd);
          }}
          className="unrot-btn-green px-4 py-2 text-sm"
        >
          {showAdd ? "Cancel" : "+ Add Reward"}
        </button>
      </div>

      {/* Balance */}
      <div
        className="rounded-2xl p-3 mb-4 flex items-center gap-3"
        style={{
          background: "var(--unrot-card)",
          border: "1px solid var(--unrot-border)",
        }}
      >
        <span className="text-2xl">🪙</span>
        <p className="text-sm" style={{ color: "var(--unrot-muted)" }}>
          Balance:{" "}
          <span
            className="font-bold"
            style={{
              color: balance >= 0 ? "var(--unrot-green)" : "var(--unrot-red)",
            }}
          >
            {balance} coins
          </span>
        </p>
      </div>

      {/* Add reward form */}
      {showAdd && (
        <div
          className="rounded-2xl p-4 mb-5 animate-slide-up"
          style={{
            background: "var(--unrot-card)",
            border: "1px solid var(--unrot-border)",
          }}
        >
          <p className="font-bold mb-3" style={{ color: "var(--unrot-text)" }}>
            New Reward
          </p>
          <div className="flex flex-col gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Reward name (e.g. Watch a movie)"
              className="px-3 py-2 rounded-xl text-sm"
              style={{
                background: "var(--unrot-bg)",
                border: "1px solid var(--unrot-border)",
                color: "var(--unrot-text)",
              }}
            />
            <input
              type="number"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              placeholder="Coin cost"
              min="1"
              className="px-3 py-2 rounded-xl text-sm"
              style={{
                background: "var(--unrot-bg)",
                border: "1px solid var(--unrot-border)",
                color: "var(--unrot-text)",
              }}
            />
            <button
              type="button"
              onClick={addReward}
              disabled={!newName.trim() || !newCost}
              className="unrot-btn-green py-2 text-sm"
            >
              Create Reward
            </button>
          </div>
          <p className="text-xs mt-3" style={{ color: "var(--unrot-dim)" }}>
            Examples: {examples.join(", ")}
          </p>
        </div>
      )}

      {/* Rewards list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-2xl animate-pulse"
              style={{ background: "var(--unrot-card)" }}
            />
          ))}
        </div>
      ) : rewards.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background: "var(--unrot-card)",
            border: "1px solid var(--unrot-border)",
          }}
        >
          <p className="text-4xl mb-3">🎁</p>
          <p className="mb-3" style={{ color: "var(--unrot-muted)" }}>
            No rewards yet. Create your first!
          </p>
          <div className="flex flex-col gap-2">
            {examples.map((e) => (
              <p
                key={e}
                className="text-xs px-3 py-1 rounded-lg"
                style={{
                  background: "var(--unrot-bg)",
                  color: "var(--unrot-dim)",
                }}
              >
                {e}
              </p>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rewards.map((r) => {
            const cost = Number(r.coinCost);
            const canAfford = balance - cost >= -20;
            return (
              <div
                key={r.id.toString()}
                className="flex items-center gap-3 p-4 rounded-2xl"
                style={{
                  background: "var(--unrot-card)",
                  border: "1px solid var(--unrot-border)",
                }}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold truncate"
                    style={{ color: "var(--unrot-text)" }}
                  >
                    {r.name}
                  </p>
                  <p className="text-sm" style={{ color: "var(--unrot-gold)" }}>
                    {cost} 🪙
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => redeemReward(r)}
                    disabled={!canAfford || redeeming !== null}
                    className="text-xs px-3 py-1.5 rounded-xl font-semibold"
                    style={{
                      background: canAfford
                        ? "var(--unrot-green)"
                        : "var(--unrot-card)",
                      color: canAfford ? "#fff" : "var(--unrot-dim)",
                      border: "1px solid var(--unrot-border)",
                      opacity: !canAfford ? 0.5 : 1,
                    }}
                  >
                    {redeeming === r.id.toString() ? "..." : "Redeem"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteReward(r.id)}
                    className="text-xs px-2 py-1.5 rounded-xl"
                    style={{
                      background: "rgba(224,107,90,0.15)",
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
  );
}
