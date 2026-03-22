import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Task } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { haptic } from "../utils/haptics";

interface Props {
  task: Task | null;
  onClose: () => void;
  onSave: () => void;
}

type TaskType = "pushups" | "custom";
type RepeatOption = "daily" | "weekly" | "never" | "custom";

export default function TaskModal({ task, onClose, onSave }: Props) {
  const { actor, isFetching } = useActor();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("custom");
  const [description, setDescription] = useState("");
  const [coins, setCoins] = useState("5");
  const [repeat, setRepeat] = useState<RepeatOption>("daily");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      const kind = task.taskType.__kind__;
      setType(kind === "pushups" ? "pushups" : "custom");
      setCoins(task.coinReward.toString());
      if (kind === "custom")
        setDescription(
          (task.taskType as { __kind__: "custom"; custom: string }).custom,
        );
      const rk = task.repeatOption.__kind__;
      setRepeat(rk as RepeatOption);
    }
  }, [task]);

  const buildTaskType = () => {
    if (type === "pushups")
      return { __kind__: "pushups" as const, pushups: null };
    return { __kind__: "custom" as const, custom: description || title };
  };

  const buildRepeatOption = () => {
    if (repeat === "daily") return { __kind__: "daily" as const, daily: null };
    if (repeat === "weekly")
      return { __kind__: "weekly" as const, weekly: null };
    if (repeat === "never") return { __kind__: "never" as const, never: null };
    return { __kind__: "custom" as const, custom: BigInt(0) };
  };

  const save = async () => {
    if (!actor) {
      toast.error("Not connected. Please refresh and try again.");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a task title.");
      return;
    }
    haptic();
    setSaving(true);
    try {
      const tt = buildTaskType();
      const ro = buildRepeatOption();
      if (task) {
        await actor.updateTask(
          task.id,
          title.trim(),
          tt,
          task.targetReps,
          BigInt(Number.parseInt(coins) || 1),
          ro,
          false,
          task.isActive,
        );
        toast.success("Task updated!");
      } else {
        await actor.addTask(
          title.trim(),
          tt,
          BigInt(0),
          BigInt(Number.parseInt(coins) || 1),
          ro,
          false,
        );
        toast.success("Task created!");
      }
      onSave();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const scrollToInput = (e: React.FocusEvent<HTMLElement>) => {
    const el = e.currentTarget;
    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  const isDisabled = saving || isFetching;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        data-ocid="tasks.modal"
        className="w-full max-w-md rounded-t-3xl px-4 pt-4 max-h-[85dvh] overflow-y-auto"
        style={{
          background: "var(--unrot-card)",
          border: "1px solid var(--unrot-border)",
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center mb-3">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: "var(--unrot-border)" }}
          />
        </div>

        {/* Connecting banner */}
        {isFetching && (
          <div
            className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 mb-3 text-xs font-semibold"
            style={{
              background: "rgba(46,204,113,0.1)",
              border: "1px solid rgba(46,204,113,0.25)",
              color: "var(--unrot-green)",
            }}
          >
            <span className="animate-spin">⟳</span> Connecting...
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--unrot-text)" }}
          >
            {task ? "Edit Task" : "New Task"}
          </h2>
          <button
            type="button"
            data-ocid="tasks.close_button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "var(--unrot-muted)",
            }}
          >
            ✕
          </button>
        </div>

        <div
          className="flex flex-col gap-3"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
          }}
        >
          {/* Title */}
          <div>
            <label
              htmlFor="task-title"
              className="text-xs font-semibold uppercase tracking-wider mb-1 block"
              style={{ color: "var(--unrot-muted)" }}
            >
              Title
            </label>
            <input
              id="task-title"
              data-ocid="tasks.input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={scrollToInput}
              placeholder="What's the task?"
              className="w-full px-4 py-2.5 rounded-2xl text-sm"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--unrot-text)",
                outline: "none",
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="task-desc"
              className="text-xs font-semibold uppercase tracking-wider mb-1 block"
              style={{ color: "var(--unrot-muted)" }}
            >
              Description{" "}
              <span
                style={{
                  color: "var(--unrot-dim)",
                  textTransform: "none",
                  fontSize: "0.7rem",
                }}
              >
                (optional)
              </span>
            </label>
            <textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={scrollToInput}
              placeholder="More details..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-2xl text-sm resize-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--unrot-text)",
                outline: "none",
              }}
            />
          </div>

          {/* Type + Coin Reward side by side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Type */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--unrot-muted)" }}
              >
                Type
              </p>
              <div className="flex flex-col gap-1.5">
                {(
                  [
                    ["custom", "✅", "Custom"],
                    ["pushups", "💪", "Push-ups"],
                  ] as [TaskType, string, string][]
                ).map(([t, icon, label]) => (
                  <button
                    type="button"
                    key={t}
                    data-ocid={`tasks.${t}.toggle`}
                    onClick={() => {
                      haptic();
                      setType(t);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-semibold text-xs transition-all active:scale-95"
                    style={{
                      background:
                        type === t
                          ? "var(--unrot-green)"
                          : "rgba(255,255,255,0.06)",
                      color: type === t ? "#fff" : "var(--unrot-muted)",
                      border: "1px solid",
                      borderColor:
                        type === t
                          ? "var(--unrot-green)"
                          : "rgba(255,255,255,0.1)",
                    }}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Coin Reward */}
            <div>
              <label
                htmlFor="task-coins"
                className="text-xs font-semibold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--unrot-muted)" }}
              >
                Coins 🪙
              </label>
              <input
                id="task-coins"
                data-ocid="tasks.coins.input"
                type="number"
                value={coins}
                onChange={(e) => setCoins(e.target.value)}
                onFocus={scrollToInput}
                min="1"
                className="w-full px-4 py-2.5 rounded-2xl text-sm"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--unrot-text)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Repeat - 4 in one row */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-1 block"
              style={{ color: "var(--unrot-muted)" }}
            >
              Repeat
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  ["daily", "Daily"],
                  ["weekly", "Weekly"],
                  ["never", "Never"],
                  ["custom", "Custom"],
                ] as [RepeatOption, string][]
              ).map(([r, label]) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => {
                    haptic();
                    setRepeat(r);
                  }}
                  className="py-2 text-xs rounded-xl font-semibold transition-all active:scale-95"
                  style={{
                    background:
                      repeat === r
                        ? "var(--unrot-green)"
                        : "rgba(255,255,255,0.06)",
                    color: repeat === r ? "#fff" : "var(--unrot-muted)",
                    border: "1px solid",
                    borderColor:
                      repeat === r
                        ? "var(--unrot-green)"
                        : "rgba(255,255,255,0.1)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              data-ocid="tasks.cancel_button"
              onClick={onClose}
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
              data-ocid="tasks.submit_button"
              onClick={save}
              disabled={!title.trim() || isDisabled}
              className="flex-1 py-3 rounded-2xl font-semibold text-sm unrot-btn-green"
              style={{ opacity: !title.trim() || isDisabled ? 0.5 : 1 }}
            >
              {isFetching
                ? "Connecting..."
                : saving
                  ? "Saving..."
                  : task
                    ? "Update"
                    : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
