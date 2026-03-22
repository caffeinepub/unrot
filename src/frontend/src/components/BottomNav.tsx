import type { Tab } from "../App";
import { haptic } from "../utils/haptics";

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; icon: string; label: string }[] = [
  { id: "dashboard", icon: "⊞", label: "Dashboard" },
  { id: "analyze", icon: "📊", label: "Stats" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

export default function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-4 py-2 safe-area-bottom glass-nav">
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.id}
          data-ocid={`nav.${tab.id}.link`}
          onClick={() => {
            haptic();
            onTabChange(tab.id);
          }}
          className="flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-2xl transition-all"
          style={{
            color:
              activeTab === tab.id ? "var(--unrot-green)" : "var(--unrot-dim)",
          }}
        >
          <span className="text-xl leading-none">{tab.icon}</span>
          <span
            className="text-[10px] font-semibold tracking-wide"
            style={{
              color:
                activeTab === tab.id
                  ? "var(--unrot-green)"
                  : "var(--unrot-dim)",
            }}
          >
            {tab.label}
          </span>
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
