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
  const [showAddReward, setShowAddReward] = useState(false);
  const [newRewardName, setNewRewardName] = useState("");
  const [newRewardCost, setNewRewardCost] = useState("10");
  const [savingReward, setSavingReward] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState<bigint | null>(null);
  const [fontSize, setFontSize] = useState<number>(() => {
    const stored = localStorage.getItem("unrot-font-size");
    return stored ? Number(stored) : 100;
  });

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`;
    localStorage.setItem("unrot-font-size", String(fontSize));
  }, [fontSize]);

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
      setShowAddReward(false);
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
      setEditingRewardId(null);
      await loadRewards();
    } catch {
      toast.error("Failed to remove reward");
    }
  };

  return (
    <div className="px-5 pt-6 pb-8 max-w-lg mx-auto animate-fade-in">
      <h1
        className="text-3xl font-bold mb-7"
        style={{ color: "var(--unrot-text)" }}
      >
        Settings
      </h1>

      {/* Appearance */}
      <section className="mb-5">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-3 px-1"
          style={{ color: "var(--unrot-muted)" }}
        >
          Appearance
        </p>
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--unrot-card)",
            border: "1px solid var(--unrot-border)",
          }}
        >
          {/* Dark Mode */}
          <div className="flex items-center justify-between p-4">
            <div>
              <p
                className="font-semibold"
                style={{ color: "var(--unrot-text)" }}
              >
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
                  theme === "dark"
                    ? "var(--unrot-green)"
                    : "var(--unrot-border)",
              }}
            >
              <span
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all duration-300"
                style={{ left: theme === "dark" ? "30px" : "2px" }}
              />
            </button>
          </div>

          {/* Divider */}
          <div
            className="mx-4"
            style={{ height: "1px", background: "var(--unrot-border)" }}
          />

          {/* Font Size */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p
                  className="font-semibold"
                  style={{ color: "var(--unrot-text)" }}
                >
                  Font Size
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--unrot-muted)" }}
                >
                  Adjust text size across the app
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="font-bold"
                  style={{
                    color: "var(--unrot-green)",
                    fontSize: `${fontSize * 0.14}px`,
                    minWidth: "28px",
                    textAlign: "right",
                  }}
                >
                  Aa
                </span>
                <span
                  className="text-xs font-semibold min-w-[40px] text-right"
                  style={{ color: "var(--unrot-muted)" }}
                >
                  {fontSize}%
                </span>
              </div>
            </div>
            <div className="relative flex items-center">
              <span
                className="text-xs mr-2"
                style={{ color: "var(--unrot-dim)" }}
              >
                A
              </span>
              <input
                data-ocid="settings.font_size.input"
                type="range"
                min={80}
                max={120}
                step={5}
                value={fontSize}
                onChange={(e) => {
                  haptic();
                  setFontSize(Number(e.target.value));
                }}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--unrot-green) 0%, var(--unrot-green) ${((fontSize - 80) / 40) * 100}%, rgba(255,255,255,0.12) ${((fontSize - 80) / 40) * 100}%, rgba(255,255,255,0.12) 100%)`,
                  accentColor: "var(--unrot-green)",
                }}
              />
              <span
                className="text-sm ml-2"
                style={{ color: "var(--unrot-dim)" }}
              >
                A
              </span>
            </div>
            <div className="flex justify-between mt-1 px-5">
              {[80, 90, 100, 110, 120].map((v) => (
                <span
                  key={v}
                  className="text-[10px]"
                  style={{
                    color:
                      fontSize === v
                        ? "var(--unrot-green)"
                        : "var(--unrot-dim)",
                  }}
                >
                  {v}%
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Custom Rewards */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-3 px-1">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--unrot-muted)" }}
          >
            Custom Rewards
          </p>
          <button
            type="button"
            onClick={() => {
              haptic();
              setShowAddReward(!showAddReward);
            }}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95"
            style={{
              background: showAddReward
                ? "rgba(255,255,255,0.08)"
                : "var(--unrot-green)",
              color: showAddReward ? "var(--unrot-muted)" : "#fff",
            }}
          >
            {showAddReward ? "Cancel" : "+ Add"}
          </button>
        </div>

        {/* Add reward form */}
        {showAddReward && (
          <div
            className="rounded-2xl p-4 mb-3"
            style={{
              background: "var(--unrot-card)",
              border: "1px solid rgba(46,204,113,0.2)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--unrot-green)" }}
            >
              New Reward
            </p>
            <div className="flex flex-col gap-3">
              <input
                value={newRewardName}
                onChange={(e) => setNewRewardName(e.target.value)}
                placeholder="Reward name (e.g. Movie night)"
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--unrot-text)",
                  outline: "none",
                }}
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newRewardCost}
                  onChange={(e) => setNewRewardCost(e.target.value)}
                  min="1"
                  placeholder="Coin cost"
                  className="flex-1 px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--unrot-text)",
                    outline: "none",
                  }}
                />
                <span
                  className="flex items-center text-sm"
                  style={{ color: "var(--unrot-muted)" }}
                >
                  🪙 coins
                </span>
              </div>
              <button
                type="button"
                onClick={addReward}
                disabled={!newRewardName.trim() || savingReward}
                className="w-full py-3 rounded-xl font-semibold text-sm unrot-btn-green"
                style={{ opacity: !newRewardName.trim() ? 0.5 : 1 }}
              >
                {savingReward ? "Saving..." : "Add Reward"}
              </button>
            </div>
          </div>
        )}

        {/* Rewards list */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--unrot-card)",
            border: "1px solid var(--unrot-border)",
          }}
        >
          {rewards.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-2xl mb-2">🎁</p>
              <p className="text-sm" style={{ color: "var(--unrot-muted)" }}>
                No rewards yet. Add one above!
              </p>
            </div>
          ) : (
            rewards.map((reward, i) => (
              <div key={reward.id.toString()}>
                {i > 0 && (
                  <div
                    className="mx-4"
                    style={{
                      height: "1px",
                      background: "var(--unrot-border)",
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    haptic();
                    setEditingRewardId(
                      editingRewardId === reward.id ? null : reward.id,
                    );
                  }}
                  className="w-full flex items-center justify-between p-4 text-left transition-all active:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎁</span>
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--unrot-text)" }}
                      >
                        {reward.name}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--unrot-green)" }}
                      >
                        {reward.coinCost.toString()} coins
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs"
                    style={{ color: "var(--unrot-dim)" }}
                  >
                    {editingRewardId === reward.id ? "▲" : "▼"}
                  </span>
                </button>

                {/* Expanded actions */}
                {editingRewardId === reward.id && (
                  <div
                    className="px-4 pb-4"
                    style={{ borderTop: "1px solid var(--unrot-border)" }}
                  >
                    <button
                      type="button"
                      onClick={() => deleteReward(reward.id)}
                      className="w-full mt-3 py-2.5 rounded-xl font-semibold text-sm"
                      style={{
                        background: "rgba(224,107,90,0.12)",
                        color: "#E06B5A",
                        border: "1px solid rgba(224,107,90,0.25)",
                      }}
                    >
                      Delete Reward
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Coin Rules */}
      <section className="mb-5">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-3 px-1"
          style={{ color: "var(--unrot-muted)" }}
        >
          Coin Rules
        </p>
        <div
          className="rounded-2xl p-4"
          style={{
            background: "var(--unrot-card)",
            border: "1px solid var(--unrot-border)",
          }}
        >
          <div className="flex flex-col gap-3">
            {[
              "Earn coins by completing tasks",
              "Spend coins on screen time or rewards",
              "You can go into debt up to -15 coins",
              "Debt resets automatically at midnight",
              "Push-up tracking uses your camera",
            ].map((rule) => (
              <div key={rule} className="flex items-start gap-3">
                <span
                  className="text-sm mt-0.5 flex-shrink-0"
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
      </section>

      {/* Sign out */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-4 rounded-2xl font-semibold text-sm"
        style={{
          background: "rgba(224,107,90,0.12)",
          color: "#E06B5A",
          border: "1px solid rgba(224,107,90,0.25)",
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
