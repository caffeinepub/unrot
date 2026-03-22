import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { haptic } from "../utils/haptics";

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div
      className="flex flex-col items-center justify-center min-h-dvh px-6"
      style={{
        background: "linear-gradient(160deg, #0B0F14 0%, #141A22 100%)",
      }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
            style={{
              background: "linear-gradient(135deg, #1D2631, #2A3442)",
              border: "1px solid #2A3442",
              boxShadow: "0 0 40px rgba(46,204,113,0.2)",
            }}
          >
            🌱
          </div>
        </div>
        <div className="text-center">
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ color: "var(--unrot-text)" }}
          >
            Unrot
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--unrot-muted)" }}>
            Earn screen time by moving
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="mt-12 w-full max-w-xs flex flex-col gap-3 animate-slide-up">
        {[
          ["💪", "Complete exercises", "Do push-ups and sit-ups to earn coins"],
          ["🪙", "Earn coins", "Every rep translates into digital rewards"],
          [
            "📱",
            "Redeem screen time",
            "Spend your coins on guilt-free screen time",
          ],
        ].map(([icon, title, desc]) => (
          <div
            key={title}
            className="flex gap-3 p-4 rounded-2xl"
            style={{
              background: "var(--unrot-card)",
              border: "1px solid var(--unrot-border)",
            }}
          >
            <span className="text-2xl">{icon}</span>
            <div>
              <p
                className="font-semibold text-sm"
                style={{ color: "var(--unrot-text)" }}
              >
                {title}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--unrot-muted)" }}
              >
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Login button */}
      <div className="mt-10 w-full max-w-xs animate-slide-up">
        <button
          type="button"
          onClick={() => {
            haptic();
            login();
          }}
          disabled={isLoggingIn}
          className="w-full py-4 text-base font-bold rounded-2xl unrot-btn-green"
        >
          {isLoggingIn ? "Connecting..." : "Sign In with Internet Identity"}
        </button>
        <p
          className="text-center text-xs mt-4"
          style={{ color: "var(--unrot-dim)" }}
        >
          Decentralized • Private • No password needed
        </p>
      </div>
    </div>
  );
}
