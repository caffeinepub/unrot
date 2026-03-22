import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  Redemption,
  TaskCompletion,
  UserProfile,
  backendInterface,
} from "../backend.d";

interface Props {
  actor: backendInterface | null;
  profile: UserProfile | null;
  onRefreshProfile: () => Promise<void>;
}

export default function Analyze({ actor }: Props) {
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!actor) return;
    try {
      const [c, r] = await Promise.all([
        actor.getTaskCompletionHistory(),
        actor.getRedemptionHistory(),
      ]);
      setCompletions(c);
      setRedemptions(r);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  // Build last 7 days of data
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const coinsEarnedPerDay = days.map((day) => {
    const dayStr = day.toDateString();
    return completions
      .filter(
        (c) =>
          new Date(Number(c.completedAt) / 1_000_000).toDateString() === dayStr,
      )
      .reduce((sum, c) => sum + Number(c.coinsEarned), 0);
  });

  const maxEarned = Math.max(...coinsEarnedPerDay, 1);
  const totalEarned = completions.reduce(
    (s, c) => s + Number(c.coinsEarned),
    0,
  );
  const totalSpent = redemptions.reduce((s, r) => s + Number(r.coinsSpent), 0);

  // Streak
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (coinsEarnedPerDay[i] > 0) streak++;
    else break;
  }

  const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto animate-fade-in">
      <h1
        className="text-2xl font-bold mb-5"
        style={{ color: "var(--unrot-text)" }}
      >
        Analyze
      </h1>

      <div
        className="rounded-2xl p-3 mb-5 text-xs"
        style={{
          background: "rgba(46,204,113,0.1)",
          border: "1px solid rgba(46,204,113,0.2)",
          color: "var(--unrot-muted)",
        }}
      >
        ℹ️ Real-time screen time requires native app access. Showing your Unrot
        activity instead.
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          {
            label: "Earned",
            value: totalEarned,
            icon: "📈",
            color: "var(--unrot-green)",
          },
          {
            label: "Spent",
            value: totalSpent,
            icon: "📉",
            color: "var(--unrot-red)",
          },
          {
            label: "Streak",
            value: streak,
            icon: "🔥",
            color: "var(--unrot-amber)",
            suffix: "d",
          },
        ].map(({ label, value, icon, color, suffix }) => (
          <div
            key={label}
            className="rounded-2xl p-3 text-center"
            style={{
              background: "var(--unrot-card)",
              border: "1px solid var(--unrot-border)",
            }}
          >
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-xl font-bold" style={{ color }}>
              {value}
              {suffix}
            </p>
            <p className="text-xs" style={{ color: "var(--unrot-muted)" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* 7-day bar chart */}
      <div
        className="rounded-2xl p-4 mb-5"
        style={{
          background: "var(--unrot-card)",
          border: "1px solid var(--unrot-border)",
        }}
      >
        <p className="font-bold mb-4" style={{ color: "var(--unrot-text)" }}>
          7-Day Activity
        </p>
        <div className="flex items-end gap-2 h-24">
          {days.map((d, i) => {
            const h = coinsEarnedPerDay[i];
            const pct = (h / maxEarned) * 100;
            const isToday = d.toDateString() === today.toDateString();
            return (
              <div
                key={d.toISOString()}
                className="flex flex-col items-center flex-1 gap-1"
              >
                <div
                  className="w-full rounded-t-lg flex items-end"
                  style={{ height: "80px" }}
                >
                  <div
                    className="w-full rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${Math.max(pct, h > 0 ? 10 : 2)}%`,
                      background: isToday
                        ? "var(--unrot-green)"
                        : "rgba(46,204,113,0.4)",
                    }}
                  />
                </div>
                <p
                  className="text-xs"
                  style={{
                    color: isToday ? "var(--unrot-green)" : "var(--unrot-dim)",
                  }}
                >
                  {dayLabels[d.getDay()]}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      {!loading && completions.length > 0 && (
        <div>
          <p className="font-bold mb-3" style={{ color: "var(--unrot-text)" }}>
            Recent Completions
          </p>
          <div className="flex flex-col gap-2">
            {completions.slice(0, 10).map((c) => (
              <div
                key={c.completedAt.toString()}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{
                  background: "var(--unrot-card)",
                  border: "1px solid var(--unrot-border)",
                }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--unrot-text)" }}
                >
                  {c.taskTitle}
                </p>
                <p
                  className="text-sm font-bold"
                  style={{ color: "var(--unrot-green)" }}
                >
                  +{c.coinsEarned.toString()} 🪙
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      {!loading && completions.length === 0 && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background: "var(--unrot-card)",
            border: "1px solid var(--unrot-border)",
          }}
        >
          <p className="text-4xl mb-3">📊</p>
          <p style={{ color: "var(--unrot-muted)" }}>
            Complete tasks to see your activity here
          </p>
        </div>
      )}
    </div>
  );
}
