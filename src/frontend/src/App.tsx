import { useEffect, useState } from "react";
import type { UserProfile } from "./backend.d";
import BottomNav from "./components/BottomNav";
import OnboardingModal from "./components/OnboardingModal";
import { Toaster } from "./components/ui/sonner";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import Analyze from "./pages/Analyze";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import Settings from "./pages/Settings";

export type Tab = "dashboard" | "analyze" | "settings";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor } = useActor();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("unrot_theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
    localStorage.setItem("unrot_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!actor || !identity) return;
    actor
      .getProfile()
      .then((p) => {
        setProfile(p);
        if (!p.onboardingComplete) {
          setShowOnboarding(true);
        }
      })
      .catch(() => {});
  }, [actor, identity]);

  const refreshProfile = async () => {
    if (!actor) return;
    try {
      const p = await actor.getProfile();
      setProfile(p);
    } catch {}
  };

  const handleOnboardingDone = async () => {
    setShowOnboarding(false);
    if (actor) {
      try {
        await actor.markOnboardingComplete();
      } catch {}
    }
    await refreshProfile();
  };

  if (isInitializing) {
    return (
      <div
        className="flex items-center justify-center min-h-dvh"
        style={{ background: "var(--unrot-bg)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{
              borderColor: "var(--unrot-green)",
              borderTopColor: "transparent",
            }}
          />
          <p style={{ color: "var(--unrot-muted)" }} className="text-sm">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoginPage />;
  }

  const tabProps = { actor, profile, onRefreshProfile: refreshProfile };

  return (
    <div
      className="flex flex-col min-h-dvh"
      style={{ background: "var(--unrot-bg)" }}
    >
      {showOnboarding && <OnboardingModal onDone={handleOnboardingDone} />}

      <main className="flex-1 pb-20 overflow-y-auto">
        {activeTab === "dashboard" && <Dashboard {...tabProps} />}
        {activeTab === "analyze" && <Analyze {...tabProps} />}
        {activeTab === "settings" && (
          <Settings {...tabProps} theme={theme} onThemeChange={setTheme} />
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <Toaster position="top-center" />
    </div>
  );
}
