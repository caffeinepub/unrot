import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Task, UserProfile, backendInterface } from "../backend.d";
import { AnimatedCoinBalance } from "../components/AnimatedCoinBalance";
import CameraExerciseModal from "../components/CameraExerciseModal";
import RedeemModal from "../components/RedeemModal";
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
  const [showCompleted, setShowCompleted] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const didAutoAdd = useRef(false);

  const loadTasks = useCallback(async () => {
    if (!actor) return;
    try {
      const t = await actor.getTasks();
      setTasks(t);
      return t;
    } catch {
      toast.error("Failed to load tasks");
      return [];
    } finally {
      setLoading(false);
    }
  }, [actor]);

  // Auto-add pushups and situps if they don't exist yet
  const autoAddDefaultTasks = useCallback(
    async (existingTasks: Task[]) => {
      if (!actor || didAutoAdd.current) return;
      didAutoAdd.current = true;
      const hasPushups = existingTasks.some(
        (t) => t.taskType.__kind__ === "pushups",
      );
      const hasSitups = existingTasks.some(
        (t) => t.taskType.__kind__ === "situps",
      );
      let changed = false;
      try {
        if (!hasPushups) {
          await actor.addTask(
            "10 Push-ups",
            { __kind__: "pushups", pushups: null },
            BigInt(10),
            BigInt(10),
            { __kind__: "daily", daily: null },
            false,
          );
          changed = true;
        }
        if (!hasSitups) {
          await actor.addTask(
            "20 Sit-ups",
            { __kind__: "situps", situps: null },
            BigInt(20),
            BigInt(10),
            { __kind__: "daily", daily: null },
            false,
          );
          changed = true;
        }
        if (changed) {
          await loadTasks();
        }
      } catch {
        // silently ignore auto-add failures
      }
    },
    [actor, loadTasks],
  );

  useEffect(() => {
    loadTasks().then((t) => {
      if (t) autoAddDefaultTasks(t);
    });
  }, [loadTasks, autoAddDefaultTasks]);

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
    <div className="px-4 pt-4 pb-4 max-w-2xl mx-auto animate-fade-in">
      {/* Top header row */}
      <div className="flex items-center justify-between mb-4">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--unrot-text)" }}
        >
          Dashboard
        </h1>
        <button
          type="button"
          data-ocid="tasks.open_modal_button_top"
          onClick={() => {
            haptic();
            setEditTask(null);
            setShowTaskModal(true);
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full font-light text-2xl transition-all active:scale-95"
          style={{
            background: "var(--unrot-green)",
            color: "#fff",
            boxShadow: "0 2px 12px rgba(46,204,113,0.35)",
          }}
        >
          +
        </button>
      </div>

      {/* Balance Card */}
      <div
        className="relative rounded-3xl p-5 mb-4 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1A212B 0%, #1D2631 100%)",
          border: "1px solid rgba(46,204,113,0.15)",
        }}
      >
        <p
          className="text-xs font-semibold tracking-widest uppercase mb-1"
          style={{ color: "var(--unrot-muted)" }}
        >
          Unrot Coins
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-end gap-2">
            <AnimatedCoinBalance value={balance} />
            <span className="text-3xl mb-1">🪙</span>
          </div>
          <button
            type="button"
            onClick={() => {
              haptic();
              setShowRedeemModal(true);
            }}
            className="px-4 py-2 rounded-2xl font-bold text-sm transition-all active:scale-95"
            style={{
              background: "var(--unrot-green)",
              color: "#fff",
              boxShadow: "0 2px 10px rgba(46,204,113,0.3)",
            }}
          >
            Redeem
          </button>
        </div>
        <p className="text-xs mt-1" style={{ color: "var(--unrot-muted)" }}>
          Earn screen time by moving!
        </p>
      </div>

      {/* Debt warnings */}
      {balance < 0 && balance > -15 && (
        <div
          className="rounded-2xl p-3 mb-3 flex items-center gap-2"
          style={{
            background: "rgba(224,107,90,0.12)",
            border: "1px solid rgba(224,107,90,0.25)",
          }}
        >
          <span>⚠️</span>
          <p className="text-sm font-medium" style={{ color: "#E06B5A" }}>
            You're in debt! Complete tasks to earn coins.
          </p>
        </div>
      )}
      {balance <= -15 && (
        <div
          className="rounded-2xl p-3 mb-3 flex items-center gap-2"
          style={{
            background: "rgba(224,107,90,0.15)",
            border: "1px solid rgba(224,107,90,0.4)",
          }}
        >
          <span>🚫</span>
          <p className="text-sm font-medium" style={{ color: "#E06B5A" }}>
            Debt limit reached (-15)! Resets at midnight.
          </p>
        </div>
      )}

      {/* Active Tasks */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <h2
            className="text-base font-bold"
            style={{ color: "var(--unrot-text)" }}
          >
            Active Tasks
          </h2>
          {activeTasks.length > 0 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(46,204,113,0.15)",
                color: "var(--unrot-green)",
              }}
            >
              {activeTasks.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 rounded-2xl animate-pulse"
                style={{ background: "var(--unrot-card)" }}
              />
            ))}
          </div>
        ) : activeTasks.length === 0 ? (
          <div
            data-ocid="tasks.empty_state"
            className="rounded-2xl p-6 text-center"
            style={{
              background: "rgba(26,33,43,0.6)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-sm" style={{ color: "var(--unrot-muted)" }}>
              No active tasks. Tap + to start earning!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {activeTasks.map((task, idx) => (
              <TaskCard
                key={task.id.toString()}
                data-ocid={`tasks.item.${idx + 1}`}
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
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 mb-2"
          >
            <h2
              className="text-sm font-bold"
              style={{ color: "var(--unrot-muted)" }}
            >
              Completed ({completedTasks.length})
            </h2>
            <span style={{ color: "var(--unrot-dim)", fontSize: 10 }}>
              {showCompleted ? "▲" : "▼"}
            </span>
          </button>
          {showCompleted && (
            <div className="flex flex-col gap-2">
              {completedTasks.map((task) => (
                <div
                  key={task.id.toString()}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{
                    background: "var(--unrot-card)",
                    border: "1px solid var(--unrot-border)",
                    opacity: 0.6,
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
          )}
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

      {showRedeemModal && (
        <RedeemModal
          actor={actor}
          profile={profile}
          onClose={() => setShowRedeemModal(false)}
          onRefreshProfile={onRefreshProfile}
        />
      )}
    </div>
  );
}
