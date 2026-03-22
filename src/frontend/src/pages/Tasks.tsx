import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Task, UserProfile, backendInterface } from "../backend.d";
import CameraExerciseModal from "../components/CameraExerciseModal";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import { haptic } from "../utils/haptics";

interface Props {
  actor: backendInterface | null;
  profile: UserProfile | null;
  onRefreshProfile: () => Promise<void>;
}

export default function Tasks({ actor, onRefreshProfile }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [exerciseTask, setExerciseTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"all" | "exercise" | "custom">("all");

  const loadTasks = useCallback(async () => {
    if (!actor) return;
    try {
      const t = await actor.getTasks();
      setTasks(t);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleComplete = (task: Task) => {
    haptic();
    if (
      task.taskType.__kind__ === "pushups" ||
      task.taskType.__kind__ === "situps"
    ) {
      setExerciseTask(task);
    } else {
      completeTask(task.id);
    }
  };

  const completeTask = async (taskId: bigint) => {
    if (!actor) return;
    try {
      await actor.completeTask(taskId);
      toast.success("Task completed! 🪙");
      await Promise.all([loadTasks(), onRefreshProfile()]);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to complete task");
    }
  };

  const handleDelete = async (taskId: bigint) => {
    if (!actor) return;
    haptic();
    try {
      await actor.deleteTask(taskId);
      toast.success("Task deleted");
      await loadTasks();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "exercise")
      return (
        t.taskType.__kind__ === "pushups" || t.taskType.__kind__ === "situps"
      );
    if (filter === "custom") return t.taskType.__kind__ === "custom";
    return true;
  });

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--unrot-text)" }}
        >
          Tasks
        </h1>
        <button
          type="button"
          onClick={() => {
            haptic();
            setEditTask(null);
            setShowTaskModal(true);
          }}
          className="unrot-btn-green px-4 py-2 text-sm"
        >
          + New Task
        </button>
      </div>

      {/* Presets */}
      <div className="flex gap-2 mb-4">
        <p
          className="text-xs self-center"
          style={{ color: "var(--unrot-muted)" }}
        >
          Presets:
        </p>
        <button
          type="button"
          onClick={() => {
            haptic();
            setEditTask(null);
            setShowTaskModal(true);
          }}
          className="text-xs px-3 py-1.5 rounded-xl font-medium"
          style={{
            background: "var(--unrot-card)",
            border: "1px solid var(--unrot-border)",
            color: "var(--unrot-text)",
          }}
        >
          💪 5 Push-ups
        </button>
        <button
          type="button"
          onClick={() => {
            haptic();
            setEditTask(null);
            setShowTaskModal(true);
          }}
          className="text-xs px-3 py-1.5 rounded-xl font-medium"
          style={{
            background: "var(--unrot-card)",
            border: "1px solid var(--unrot-border)",
            color: "var(--unrot-text)",
          }}
        >
          🏋️ 20 Sit-ups
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(["all", "exercise", "custom"] as const).map((f) => (
          <button
            type="button"
            key={f}
            onClick={() => {
              haptic();
              setFilter(f);
            }}
            className="text-xs px-3 py-1.5 rounded-full font-semibold whitespace-nowrap"
            style={{
              background:
                filter === f ? "var(--unrot-green)" : "var(--unrot-card)",
              color: filter === f ? "#fff" : "var(--unrot-muted)",
              border: "1px solid var(--unrot-border)",
            }}
          >
            {f === "all" ? "All" : f === "exercise" ? "Exercise" : "Custom"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 rounded-2xl animate-pulse"
              style={{ background: "var(--unrot-card)" }}
            />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background: "var(--unrot-card)",
            border: "1px solid var(--unrot-border)",
          }}
        >
          <p className="text-4xl mb-3">🎯</p>
          <p style={{ color: "var(--unrot-muted)" }}>
            No tasks yet. Add your first task!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id.toString()}
              task={task}
              onComplete={() => handleComplete(task)}
              onEdit={() => {
                haptic();
                setEditTask(task);
                setShowTaskModal(true);
              }}
              onDelete={() => handleDelete(task.id)}
            />
          ))}
        </div>
      )}

      {exerciseTask && (
        <CameraExerciseModal
          task={exerciseTask}
          onComplete={() => {
            setExerciseTask(null);
            completeTask(exerciseTask.id);
          }}
          onClose={() => setExerciseTask(null)}
        />
      )}
      {showTaskModal && (
        <TaskModal
          task={editTask}
          onClose={() => {
            setShowTaskModal(false);
            setEditTask(null);
          }}
          onSave={() => {
            setShowTaskModal(false);
            setEditTask(null);
            loadTasks();
          }}
        />
      )}
    </div>
  );
}
