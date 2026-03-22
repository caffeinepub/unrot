import { toast } from "sonner";
import type { UserProfile, backendInterface } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { haptic } from "../utils/haptics";

interface Props {
  actor: backendInterface | null;
  profile: UserProfile | null;
  onRefreshProfile: () => Promise<void>;
  theme: "dark" | "light";
  onThemeChange: (t: "dark" | "light") => void;
}

export default function Settings({ theme, onThemeChange }: Props) {
  const ii = useInternetIdentity();

  const handleLogout = () => {
    haptic();
    ii.clear();
    toast.success("Logged out");
  };

  const toggleTheme = () => {
    haptic();
    onThemeChange(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto animate-fade-in">
      <h1
        className="text-2xl font-bold mb-6"
        style={{ color: "var(--unrot-text)" }}
      >
        Settings
      </h1>

      {/* Appearance */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{
          background: "var(--unrot-card)",
          border: "1px solid var(--unrot-border)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "var(--unrot-muted)" }}
        >
          Appearance
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold" style={{ color: "var(--unrot-text)" }}>
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
                theme === "dark" ? "var(--unrot-green)" : "var(--unrot-border)",
            }}
          >
            <span
              className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all duration-300"
              style={{ left: theme === "dark" ? "30px" : "2px" }}
            />
          </button>
        </div>
      </div>

      {/* About */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{
          background: "var(--unrot-card)",
          border: "1px solid var(--unrot-border)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "var(--unrot-muted)" }}
        >
          About
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--unrot-text)" }}>
              Version
            </p>
            <p className="text-sm" style={{ color: "var(--unrot-muted)" }}>
              1.0.0
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--unrot-text)" }}>
              Platform
            </p>
            <p className="text-sm" style={{ color: "var(--unrot-muted)" }}>
              Internet Computer
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--unrot-text)" }}>
              Coin System
            </p>
            <p className="text-sm" style={{ color: "var(--unrot-muted)" }}>
              1 coin = 1 min
            </p>
          </div>
        </div>
      </div>

      {/* Coin system info */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{
          background: "var(--unrot-card)",
          border: "1px solid var(--unrot-border)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: "var(--unrot-muted)" }}
        >
          Coin Rules
        </p>
        <div className="flex flex-col gap-2">
          {[
            "Earn coins by completing tasks",
            "Spend coins on screen time or rewards",
            "You can go into debt up to -20 coins",
            "Debt resets automatically at midnight",
            "Exercise detection uses your camera",
          ].map((rule) => (
            <div key={rule} className="flex items-start gap-2">
              <span
                className="text-xs mt-0.5"
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

      {/* Sign out */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-3 rounded-2xl font-semibold text-sm"
        style={{
          background: "rgba(224,107,90,0.15)",
          color: "#E06B5A",
          border: "1px solid rgba(224,107,90,0.3)",
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
