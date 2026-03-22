import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Reward, UserProfile, backendInterface } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { haptic } from "../utils/haptics";

interface Props {
  actor: backendInterface | null;
  profile: UserProfile | null;
  onRefreshProfile: () => Promise<void>;
  theme: "dark" | "light";
  onThemeChange: (t: "dark" | "light") => void;
}

export default function Settings({ actor, theme, onThemeChange }: Props) {
  const ii = useInternetIdentity();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [newRewardName, setNewRewardName] = useState("");
  const [newRewardCost, setNewRewardCost] = useState("10");
  const [savingReward, setSavingReward] = useState(false);

  const loadRewards = useCallback(async () => {
    if (!actor) return;
    try {
      const r = await actor.getRewards();
      setRewards(r);
    } catch (_e) {
      // ignore
    }
  }, [actor]);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  const handleLogout = () => {
    haptic();
    ii.clear();
    toast.success("Logged out");
  };

  const toggleTheme = () => {
    haptic();
    onThemeChange(theme === "dark" ? "light" : "dark");
  };

  const addReward = async () => {
    if (!actor || !newRewardName.trim()) return;
    haptic();
    setSavingReward(true);
    try {
      await actor.addReward(
        newRewardName.trim(),
        BigInt(Number.parseInt(newRewardCost) || 1),
      );
      toast.success("Reward added!");
      setNewRewardName("");
      setNewRewardCost("10");
      await loadRewards();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add reward");
    } finally {
      setSavingReward(false);
    }
  };

  const deleteReward = async (rewardId: bigint) => {
    if (!actor) return;
    haptic();
    try {
      await actor.deleteReward(rewardId);
      toast.success("Reward removed");
      await loadRewards();
    } catch {
      toast.error("Failed to remove reward");
    }
  };

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto animate-fade-in">
      <h1
        className="text-2xl font-bold mb-6"
        style={{ color: "var(--unrot-text)" }}
      >
        Settings
      </h1>

      {/* Appearance */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{
          background: "var(--unrot-card)",
          border: "1px solid var(--unrot-border)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "var(--unrot-muted)" }}
        >
          Appearance
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold" style={{ color: "var(--unrot-text)" }}>
              Dark Mode
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--unrot-muted)" }}
            >
              Toggle light/dark theme
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="relative w-14 h-7 rounded-full transition-all duration-300"
            style={{
              background:
                theme === "dark" ? "var(--unrot-green)" : "var(--unrot-border)",
            }}
          >
            <span
              className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all duration-300"
              style={{ left: theme === "dark" ? "30px" : "2px" }}
            />
          </button>
        </div>
      </div>

      {/* Custom Rewards */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{
          background: "var(--unrot-card)",
          border: "1px solid var(--unrot-border)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "var(--unrot-muted)" }}
        >
          Custom Rewards
        </p>

        {/* Add new reward */}
        <div className="flex flex-col gap-2 mb-4">
          <input
            value={newRewardName}
            onChange={(e) => setNewRewardName(e.target.value)}
            placeholder="Reward name (e.g. Movie night)"
            className="w-full px-3 py-2.5 rounded-xl text-sm"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--unrot-text)",
              outline: "none",
            }}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="number"
                value={newRewardCost}
                onChange={(e) => setNewRewardCost(e.target.value)}
                min="1"
                placeholder="Coin cost"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--unrot-text)",
                  outline: "none",
                }}
              />
            </div>
            <button
              type="button"
              onClick={addReward}
              disabled={!newRewardName.trim() || savingReward}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm unrot-btn-green"
              style={{ opacity: !newRewardName.trim() ? 0.5 : 1 }}
            >
              {savingReward ? "..." : "Add"}
            </button>
          </div>
        </div>

        {/* Rewards list */}
        {rewards.length === 0 ? (
          <p
            className="text-sm text-center py-3"
            style={{ color: "var(--unrot-muted)" }}
          >
            No rewards yet. Add one above!
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {rewards.map((reward) => (
              <div
                key={reward.id.toString()}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--unrot-text)" }}
                  >
                    {reward.name}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--unrot-green)" }}
                  >
                    {reward.coinCost.toString()} coins
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteReward(reward.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{
                    background: "rgba(224,107,90,0.15)",
                    color: "#E06B5A",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* About */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{
          background: "var(--unrot-card)",
          border: "1px solid var(--unrot-border)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "var(--unrot-muted)" }}
        >
          Coin Rules
        </p>
        <div className="flex flex-col gap-2">
          {[
            "Earn coins by completing tasks",
            "Spend coins on screen time or rewards",
            "You can go into debt up to -15 coins",
            "Debt resets automatically at midnight",
            "Exercise detection uses your camera",
          ].map((rule) => (
            <div key={rule} className="flex items-start gap-2">
              <span
                className="text-xs mt-0.5"
                style={{ color: "var(--unrot-green)" }}
              >
                •
              </span>
              <p className="text-sm" style={{ color: "var(--unrot-text)" }}>
                {rule}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-3 rounded-2xl font-semibold text-sm"
        style={{
          background: "rgba(224,107,90,0.15)",
          color: "#E06B5A",
          border: "1px solid rgba(224,107,90,0.3)",
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
