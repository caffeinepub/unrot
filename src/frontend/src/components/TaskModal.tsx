import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Task, backendInterface } from "../backend.d";
import { haptic } from "../utils/haptics";

interface Props {
  actor: backendInterface | null;
  task: Task | null;
  onClose: () => void;
  onSave: () => void;
}

type TaskType = "pushups" | "situps" | "custom";
type RepeatOption = "daily" | "weekly" | "never" | "custom";

export default function TaskModal({ actor, task, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("custom");
  const [reps, setReps] = useState("10");
  const [coins, setCoins] = useState("5");
  const [repeat, setRepeat] = useState<RepeatOption>("daily");
  const [customDesc, setCustomDesc] = useState("");
  const [photoProof, setPhotoProof] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setType(task.taskType.__kind__ as TaskType);
      setReps(task.targetReps.toString());
      setCoins(task.coinReward.toString());
      if (task.taskType.__kind__ === "custom")
        setCustomDesc(
          (task.taskType as { __kind__: "custom"; custom: string }).custom,
        );
      const rk = task.repeatOption.__kind__;
      setRepeat(rk as RepeatOption);
    }
  }, [task]);

  const handleSuggestion = (preset: "pushups" | "situps") => {
    haptic();
    if (preset === "pushups") {
      setTitle("5 Push-ups");
      setType("pushups");
      setReps("5");
      setCoins("5");
      setRepeat("daily");
    } else {
      setTitle("20 Sit-ups");
      setType("situps");
      setReps("20");
      setCoins("10");
      setRepeat("daily");
    }
  };

  const buildTaskType = () => {
    if (type === "pushups")
      return { __kind__: "pushups" as const, pushups: null };
    if (type === "situps") return { __kind__: "situps" as const, situps: null };
    return { __kind__: "custom" as const, custom: customDesc || title };
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
          BigInt(Number.parseInt(reps) || 0),
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
          BigInt(Number.parseInt(reps) || 0),
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        data-ocid="tasks.modal"
        className="w-full max-w-md rounded-t-3xl px-5 pt-5 pb-8 max-h-[88dvh] overflow-y-auto animate-slide-up glass-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--unrot-text)" }}
          >
            {task ? "Edit Task" : "New Task"}
          </h2>
          <button
            type="button"
            data-ocid="tasks.close_button"
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

        {/* Photo Proof toggle */}
        <div
          className="flex items-center justify-between p-3 rounded-xl mb-4"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">📷</span>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--unrot-text)" }}
              >
                Photo Proof
              </p>
              <p className="text-xs" style={{ color: "var(--unrot-muted)" }}>
                Require a photo to verify
              </p>
            </div>
          </div>
          <button
            type="button"
            data-ocid="tasks.toggle"
            onClick={() => {
              haptic();
              setPhotoProof(!photoProof);
            }}
            className="relative w-12 h-6 rounded-full transition-all"
            style={{
              background: photoProof
                ? "var(--unrot-green)"
                : "var(--unrot-border)",
            }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
              style={{ left: photoProof ? "26px" : "2px" }}
            />
          </button>
        </div>

        {/* Suggestions (only for new tasks) */}
        {!task && (
          <div className="mb-4">
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "var(--unrot-muted)" }}
            >
              Suggestions
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSuggestion("pushups")}
                className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                style={{
                  background: "rgba(46,204,113,0.12)",
                  border: "1px solid rgba(46,204,113,0.25)",
                  color: "var(--unrot-green)",
                }}
              >
                💪 Push-ups
              </button>
              <button
                type="button"
                onClick={() => handleSuggestion("situps")}
                className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                style={{
                  background: "rgba(46,204,113,0.12)",
                  border: "1px solid rgba(46,204,113,0.25)",
                  color: "var(--unrot-green)",
                }}
              >
                🏋️ Sit-ups
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label
              htmlFor="task-title"
              className="text-xs font-semibold uppercase tracking-wide mb-1 block"
              style={{ color: "var(--unrot-muted)" }}
            >
              Title
            </label>
            <input
              id="task-title"
              data-ocid="tasks.input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--unrot-text)",
                outline: "none",
              }}
            />
          </div>

          {/* Type */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2 block"
              style={{ color: "var(--unrot-muted)" }}
            >
              Type
            </p>
            <div className="flex gap-2">
              {(
                [
                  ["pushups", "💪 Push-ups"],
                  ["situps", "🏋️ Sit-ups"],
                  ["custom", "✅ Custom"],
                ] as [TaskType, string][]
              ).map(([t, label]) => (
                <button
                  type="button"
                  key={t}
                  data-ocid={`tasks.${t}.toggle`}
                  onClick={() => {
                    haptic();
                    setType(t);
                  }}
                  className="flex-1 py-2 text-xs rounded-xl font-semibold"
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
                  {label}
                </button>
              ))}
            </div>
          </div>

          {(type === "pushups" || type === "situps") && (
            <div>
              <label
                htmlFor="task-reps"
                className="text-xs font-semibold uppercase tracking-wide mb-1 block"
                style={{ color: "var(--unrot-muted)" }}
              >
                Target Reps
              </label>
              <input
                id="task-reps"
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                min="1"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--unrot-text)",
                  outline: "none",
                }}
              />
            </div>
          )}

          {type === "custom" && (
            <div>
              <label
                htmlFor="task-desc"
                className="text-xs font-semibold uppercase tracking-wide mb-1 block"
                style={{ color: "var(--unrot-muted)" }}
              >
                Description (optional)
              </label>
              <input
                id="task-desc"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="What does this task involve?"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--unrot-text)",
                  outline: "none",
                }}
              />
            </div>
          )}

          {/* Coins */}
          <div>
            <label
              htmlFor="task-coins"
              className="text-xs font-semibold uppercase tracking-wide mb-1 block"
              style={{ color: "var(--unrot-muted)" }}
            >
              Coin Reward
            </label>
            <input
              id="task-coins"
              data-ocid="tasks.coins.input"
              type="number"
              value={coins}
              onChange={(e) => setCoins(e.target.value)}
              min="1"
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--unrot-text)",
                outline: "none",
              }}
            />
          </div>

          {/* Repeat */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2 block"
              style={{ color: "var(--unrot-muted)" }}
            >
              Repeat
            </p>
            <div className="grid grid-cols-2 gap-2">
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
                  className="py-2 text-xs rounded-xl font-semibold"
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
        </div>

        <div className="flex gap-3 mt-6">
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
            disabled={!title.trim() || saving}
            className="flex-1 py-3 rounded-2xl font-semibold text-sm unrot-btn-green"
          >
            {saving ? "Saving..." : task ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
