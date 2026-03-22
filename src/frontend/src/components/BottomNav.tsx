import type { Tab } from "../App";
import { haptic } from "../utils/haptics";

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; icon: string; label: string }[] = [
  { id: "dashboard", icon: "🏠", label: "Home" },
  { id: "tasks", icon: "✅", label: "Tasks" },
  { id: "redeem", icon: "⏱️", label: "Redeem" },
  { id: "rewards", icon: "🎁", label: "Rewards" },
  { id: "analyze", icon: "📊", label: "Stats" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

export default function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2 safe-area-bottom"
      style={{
        background: "var(--unrot-card)",
        borderTop: "1px solid var(--unrot-border)",
        backdropFilter: "blur(20px)",
      }}
    >
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.id}
          onClick={() => {
            haptic();
            onTabChange(tab.id);
          }}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all"
          style={{
            color:
              activeTab === tab.id ? "var(--unrot-green)" : "var(--unrot-dim)",
            minWidth: 44,
          }}
        >
          <span className="text-xl leading-tight">{tab.icon}</span>
          <span className="text-[10px] font-semibold">{tab.label}</span>
          {activeTab === tab.id && (
            <span
              className="w-1 h-1 rounded-full"
              style={{ background: "var(--unrot-green)" }}
            />
          )}
        </button>
      ))}
    </nav>
  );
}
