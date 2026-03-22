import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Task, UserProfile, backendInterface } from "../backend.d";
import { AnimatedCoinBalance } from "../components/AnimatedCoinBalance";
import CameraExerciseModal from "../components/CameraExerciseModal";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import { haptic } from "../utils/haptics";

interface Props {
  actor: backendInterface | null;
  profile: UserProfile | null;
  onRefreshProfile: () => Promise<void>;
}

export default function Dashboard({ actor, profile, onRefreshProfile }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [exerciseTask, setExerciseTask] = useState<Task | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

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
      toast.success("Task completed! Coins earned 🪙", { duration: 2000 });
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
      toast.error("Failed to delete task");
    }
  };

  const activeTasks = tasks.filter((t) => t.isActive && !t.completedAt);
  const completedTasks = tasks.filter((t) => t.completedAt);
  const balance = profile ? Number(profile.coinBalance) : 0;

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto animate-fade-in">
      {/* Hero */}
      <div
        className="relative rounded-3xl p-6 mb-6 overflow-hidden green-glow"
        style={{
          background: "linear-gradient(135deg, #1A212B 0%, #1D2631 100%)",
          border: "1px solid var(--unrot-border)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, #2ECC71 0%, transparent 70%)",
          }}
        />
        <p
          className="text-xs font-semibold tracking-widest uppercase mb-1"
          style={{ color: "var(--unrot-muted)" }}
        >
          Your Coin Balance
        </p>
        <div className="flex items-end gap-3">
          <AnimatedCoinBalance value={balance} />
          <span className="text-4xl mb-1 coin-glow">🪙</span>
        </div>
        <p
          className="text-xs font-bold tracking-widest uppercase mt-1"
          style={{ color: "var(--unrot-green)" }}
        >
          UNROT COINS
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--unrot-muted)" }}>
          Earn screen time by moving!
        </p>
      </div>

      {/* Debt warnings */}
      {balance < 0 && balance > -20 && (
        <div
          className="rounded-2xl p-3 mb-4 flex items-center gap-2"
          style={{
            background: "rgba(224,107,90,0.15)",
            border: "1px solid rgba(224,107,90,0.3)",
          }}
        >
          <span>⚠️</span>
          <p className="text-sm font-medium" style={{ color: "#E06B5A" }}>
            You're in debt! Complete tasks to earn coins.
          </p>
        </div>
      )}
      {balance <= -20 && (
        <div
          className="rounded-2xl p-3 mb-4 flex items-center gap-2"
          style={{
            background: "rgba(224,107,90,0.2)",
            border: "1px solid rgba(224,107,90,0.5)",
          }}
        >
          <span>🚫</span>
          <p className="text-sm font-medium" style={{ color: "#E06B5A" }}>
            Debt limit reached (-20)! Resets at midnight.
          </p>
        </div>
      )}

      {/* Active Tasks */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--unrot-text)" }}
          >
            Active Tasks
          </h2>
          <button
            type="button"
            onClick={() => {
              haptic();
              setEditTask(null);
              setShowTaskModal(true);
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl"
            style={{ background: "var(--unrot-green)", color: "#fff" }}
          >
            + Add
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-36 rounded-2xl animate-pulse"
                style={{ background: "var(--unrot-card)" }}
              />
            ))}
          </div>
        ) : activeTasks.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: "var(--unrot-card)",
              border: "1px solid var(--unrot-border)",
            }}
          >
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-sm" style={{ color: "var(--unrot-muted)" }}>
              No active tasks. Add one to start earning!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {activeTasks.map((task) => (
              <TaskCard
                key={task.id.toString()}
                task={task}
                onComplete={() => handleComplete(task)}
                onEdit={() => {
                  setEditTask(task);
                  setShowTaskModal(true);
                }}
                onDelete={() => handleDelete(task.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h2
            className="text-lg font-bold mb-3"
            style={{ color: "var(--unrot-text)" }}
          >
            Completed
          </h2>
          <div className="flex flex-col gap-2">
            {completedTasks.map((task) => (
              <div
                key={task.id.toString()}
                className="flex items-center gap-3 p-3 rounded-2xl"
                style={{
                  background: "var(--unrot-card)",
                  border: "1px solid var(--unrot-border)",
                  opacity: 0.7,
                }}
              >
                <span className="text-xl">
                  {task.taskType.__kind__ === "pushups"
                    ? "💪"
                    : task.taskType.__kind__ === "situps"
                      ? "🏋️"
                      : "✅"}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--unrot-text)" }}
                  >
                    {task.title}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="text-xs font-bold"
                    style={{ color: "var(--unrot-green)" }}
                  >
                    +{task.coinReward.toString()}
                  </span>
                  <span className="text-xs">🪙</span>
                  <span className="ml-1 text-sm">✅</span>
                </div>
              </div>
            ))}
          </div>
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
          actor={actor}
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
