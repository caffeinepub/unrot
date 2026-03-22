import { useState } from "react";
import type { Task } from "../backend.d";
import { haptic } from "../utils/haptics";

interface Props {
  task: Task;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TaskCard({
  task,
  onComplete,
  onEdit,
  onDelete,
}: Props) {
  const [showMenu, setShowMenu] = useState(false);

  const icon =
    task.taskType.__kind__ === "pushups"
      ? "💪"
      : task.taskType.__kind__ === "situps"
        ? "🏋️"
        : "✅";
  const isExercise =
    task.taskType.__kind__ === "pushups" || task.taskType.__kind__ === "situps";
  const isCompleted = !!task.completedAt;

  return (
    <div
      className="relative flex flex-col gap-2 p-3 rounded-2xl transition-all"
      style={{
        background: "var(--unrot-card)",
        border: `1px solid ${task.priority ? "rgba(245,200,75,0.4)" : "var(--unrot-border)"}`,
        opacity: isCompleted ? 0.6 : 1,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
          style={{ background: "var(--unrot-bg)" }}
        >
          {icon}
        </div>
        <button
          type="button"
          onClick={() => {
            haptic();
            setShowMenu(!showMenu);
          }}
          className="p-1 rounded-lg text-sm"
          style={{ color: "var(--unrot-muted)" }}
        >
          ⋮
        </button>
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <div
          className="absolute right-2 top-10 z-20 rounded-xl shadow-xl overflow-hidden"
          style={{
            background: "var(--unrot-card2)",
            border: "1px solid var(--unrot-border)",
            minWidth: 120,
          }}
        >
          <button
            type="button"
            onClick={() => {
              haptic();
              setShowMenu(false);
              onEdit();
            }}
            className="w-full text-left px-4 py-2.5 text-sm"
            style={{ color: "var(--unrot-text)" }}
          >
            ✏️ Edit
          </button>
          <button
            type="button"
            onClick={() => {
              haptic();
              setShowMenu(false);
              onDelete();
            }}
            className="w-full text-left px-4 py-2.5 text-sm"
            style={{ color: "#E06B5A" }}
          >
            🗑️ Delete
          </button>
        </div>
      )}

      {/* Title */}
      <div className="flex-1">
        <p
          className="text-sm font-semibold leading-tight"
          style={{ color: "var(--unrot-text)" }}
        >
          {task.title}
        </p>
        {isExercise && (
          <p className="text-xs mt-0.5" style={{ color: "var(--unrot-muted)" }}>
            {task.targetReps.toString()} reps
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-1">
        <span
          className="flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(245,200,75,0.15)",
            color: "var(--unrot-gold)",
          }}
        >
          {task.coinReward.toString()} 🪙
        </span>
        {task.priority && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: "rgba(224,107,90,0.2)", color: "#E06B5A" }}
          >
            High
          </span>
        )}
      </div>

      {/* Complete button */}
      <button
        type="button"
        onClick={() => {
          haptic();
          onComplete();
        }}
        disabled={isCompleted}
        className="w-full py-2 rounded-xl text-xs font-bold unrot-btn-green mt-1"
      >
        {isCompleted
          ? "✅ Done"
          : isExercise
            ? "📷 Start Exercise"
            : "Mark Complete"}
      </button>
    </div>
  );
}
