import { useState } from "react";
import type { OperatorUser } from "@/lib/models";
import Login from "./Login";
import Dashboard from "./Dashboard";
import AnalyticsDashboard from "./views/AnalyticsDashboard";
import AppButton from "./components/operator/AppButton";

const STORE_KEY = "operator_user";

function loadStoredUser(): OperatorUser | null {
  const stored = localStorage.getItem(STORE_KEY);
  if (!stored) return null;
  const user = JSON.parse(stored) as OperatorUser;
  // Decode the JWT exp claim and discard the stored user if the token is expired.
  try {
    const payload = JSON.parse(atob(user.token.split(".")[1])) as { exp: number };
    if (Date.now() / 1000 >= payload.exp) {
      localStorage.removeItem(STORE_KEY);
      return null;
    }
  } catch {
    localStorage.removeItem(STORE_KEY);
    return null;
  }
  return user;
}

export default function App() {
  const [user, setUser] = useState<OperatorUser | null>(loadStoredUser);

  const handleLogin = (u: OperatorUser) => {
    localStorage.setItem(STORE_KEY, JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORE_KEY);
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  // Analyst users see the analytics dashboard only — no operator queue.
  if (user.userRole === "ANALYST") {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-op-bg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-op-border bg-op-surface">
          <span className="text-[15px] font-bold text-op-primary">SIEE — Análisis</span>
          <AppButton
            title="Cerrar sesión"
            variant="primary"
            onPress={handleLogout}
          />
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <AnalyticsDashboard token={user.token} />
        </div>
      </div>
    );
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
