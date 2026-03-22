import { useCallback, useEffect, useRef, useState } from "react";
import type { Task } from "../backend.d";
import { useCamera } from "../camera/useCamera";
import { haptic } from "../utils/haptics";

interface Props {
  task: Task;
  onComplete: () => void;
  onClose: () => void;
}

type Phase = "up" | "down";

function calculateAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

declare global {
  interface Window {
    Pose: new (config: { locateFile: (f: string) => string }) => {
      setOptions: (o: object) => void;
      onResults: (cb: (r: PoseResults) => void) => void;
      send: (o: { image: HTMLVideoElement }) => Promise<void>;
    };
  }
}

interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}
type PoseInstance = InstanceType<typeof window.Pose>;

interface PoseResults {
  poseLandmarks?: PoseLandmark[];
}

const MEDIAPIPE_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404";

async function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export default function CameraExerciseModal({
  task,
  onComplete,
  onClose,
}: Props) {
  const { videoRef, startCamera, stopCamera } = useCamera({
    facingMode: "user",
    width: 640,
    height: 480,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<PoseInstance | null>(null);
  const phaseRef = useRef<Phase>("up");
  const animFrameRef = useRef<number | null>(null);
  const [reps, setReps] = useState(0);
  const repsRef = useRef(0);
  const [status, setStatus] = useState<"loading" | "running" | "error">(
    "loading",
  );
  const [loadMsg, setLoadMsg] = useState("Starting camera...");
  const target = Number(task.targetReps);
  const isPushup = task.taskType.__kind__ === "pushups";

  const onResults = useCallback(
    (results: PoseResults) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (!results.poseLandmarks) return;
      const lm = results.poseLandmarks;

      const pt = (i: number) => ({
        x: lm[i].x * canvas.width,
        y: lm[i].y * canvas.height,
      });

      let angle: number;
      if (isPushup) {
        try {
          angle = calculateAngle(pt(12), pt(14), pt(16));
        } catch {
          return;
        }
        if (angle < 90 && phaseRef.current === "up") phaseRef.current = "down";
        else if (angle > 160 && phaseRef.current === "down") {
          phaseRef.current = "up";
          repsRef.current += 1;
          setReps(repsRef.current);
          haptic();
        }
      } else {
        try {
          angle = calculateAngle(pt(12), pt(24), pt(26));
        } catch {
          return;
        }
        if (angle < 70 && phaseRef.current === "up") phaseRef.current = "down";
        else if (angle > 140 && phaseRef.current === "down") {
          phaseRef.current = "up";
          repsRef.current += 1;
          setReps(repsRef.current);
          haptic();
        }
      }
    },
    [isPushup, videoRef],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run once on mount
  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        setLoadMsg("Starting camera...");
        await startCamera();
        if (!active) return;
        setLoadMsg("Loading pose detection...");
        await loadScript(`${MEDIAPIPE_CDN}/pose.js`);
        if (!active || !window.Pose) {
          setStatus("error");
          return;
        }

        const pose = new window.Pose({
          locateFile: (f: string) => `${MEDIAPIPE_CDN}/${f}`,
        });
        pose.setOptions({
          modelComplexity: 0,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        pose.onResults(onResults);
        poseRef.current = pose;

        setStatus("running");

        const runPose = async () => {
          if (!active) return;
          const video = videoRef.current;
          if (video && video.readyState >= 2 && poseRef.current) {
            try {
              await poseRef.current.send({ image: video });
            } catch {}
          }
          animFrameRef.current = requestAnimationFrame(() => {
            setTimeout(runPose, 100);
          });
        };
        runPose();
      } catch {
        if (active) setStatus("error");
      }
    };
    init();
    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (reps >= target && target > 0) {
      haptic();
      setTimeout(() => onComplete(), 800);
    }
  }, [reps, target, onComplete]);

  const pct = Math.min((reps / target) * 100, 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-md rounded-t-3xl overflow-hidden"
        style={{
          background: "var(--unrot-card)",
          border: "1px solid var(--unrot-border)",
        }}
      >
        <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
            style={{ transform: "scaleX(-1)" }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ transform: "scaleX(-1)" }}
          />

          {status === "loading" && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: "rgba(0,0,0,0.7)" }}
            >
              <div
                className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin mb-3"
                style={{
                  borderColor: "var(--unrot-green)",
                  borderTopColor: "transparent",
                }}
              />
              <p className="text-sm" style={{ color: "var(--unrot-text)" }}>
                {loadMsg}
              </p>
            </div>
          )}

          {status === "error" && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6"
              style={{ background: "rgba(0,0,0,0.8)" }}
            >
              <p className="text-4xl">📷</p>
              <p
                className="text-sm text-center"
                style={{ color: "var(--unrot-text)" }}
              >
                Camera or pose detection unavailable
              </p>
              <button
                type="button"
                onClick={onComplete}
                className="unrot-btn-green px-6 py-2 text-sm"
              >
                Skip &amp; Complete
              </button>
            </div>
          )}

          {status === "running" && (
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <div
                className="rounded-2xl px-4 py-2"
                style={{ background: "rgba(0,0,0,0.7)" }}
              >
                <p className="text-xs" style={{ color: "var(--unrot-muted)" }}>
                  Reps
                </p>
                <p
                  className="text-3xl font-black"
                  style={{ color: "var(--unrot-green)" }}
                >
                  {reps}
                  <span
                    className="text-base font-normal"
                    style={{ color: "var(--unrot-muted)" }}
                  >
                    /{target}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-sm font-bold"
              style={{ color: "var(--unrot-text)" }}
            >
              {task.title}
            </p>
            <p className="text-sm" style={{ color: "var(--unrot-gold)" }}>
              +{task.coinReward.toString()} 🪙
            </p>
          </div>

          <div
            className="h-2 rounded-full mb-4"
            style={{ background: "var(--unrot-border)" }}
          >
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${pct}%`,
                background: reps >= target ? "#2ECC71" : "var(--unrot-green)",
              }}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onComplete}
              className="flex-1 py-3 rounded-2xl font-semibold text-sm"
              style={{
                background: "var(--unrot-border)",
                color: "var(--unrot-text)",
              }}
            >
              Skip &amp; Complete
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-semibold text-sm"
              style={{ background: "rgba(224,107,90,0.2)", color: "#E06B5A" }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
