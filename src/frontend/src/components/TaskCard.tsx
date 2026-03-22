import { useState } from "react";
import type { Task } from "../backend.d";
import { haptic } from "../utils/haptics";

interface Props {
  task: Task;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  "data-ocid"?: string;
}

export default function TaskCard({
  task,
  onComplete,
  onEdit,
  onDelete,
  "data-ocid": dataOcid,
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
      data-ocid={dataOcid}
      className="relative flex items-center gap-3 p-3.5 rounded-2xl transition-all"
      style={{
        background: "var(--unrot-card)",
        border: `1px solid ${
          task.priority ? "rgba(245,200,75,0.4)" : "var(--unrot-border)"
        }`,
        opacity: isCompleted ? 0.6 : 1,
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: "var(--unrot-bg)" }}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold leading-tight truncate"
          style={{ color: "var(--unrot-text)" }}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {isExercise && (
            <span className="text-xs" style={{ color: "var(--unrot-muted)" }}>
              {task.targetReps.toString()} reps
            </span>
          )}
          <span
            className="flex items-center gap-0.5 text-xs font-bold"
            style={{ color: "var(--unrot-gold)" }}
          >
            +{task.coinReward.toString()} 🪙
          </span>
          {task.priority && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(224,107,90,0.2)", color: "#E06B5A" }}
            >
              !
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Complete button */}
        <button
          type="button"
          onClick={() => {
            haptic();
            onComplete();
          }}
          disabled={isCompleted}
          className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={{
            background: isCompleted
              ? "var(--unrot-bg)"
              : "rgba(46,204,113,0.15)",
            color: isCompleted ? "var(--unrot-dim)" : "var(--unrot-green)",
            border: "1px solid",
            borderColor: isCompleted
              ? "var(--unrot-border)"
              : "rgba(46,204,113,0.3)",
          }}
        >
          {isCompleted ? "✅" : isExercise ? "📷" : "Done"}
        </button>

        {/* Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              haptic();
              setShowMenu(!showMenu);
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ color: "var(--unrot-muted)" }}
          >
            ⋮
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-9 z-20 rounded-xl shadow-xl overflow-hidden"
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
        </div>
      </div>
    </div>
  );
}
