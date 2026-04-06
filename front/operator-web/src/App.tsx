import { useState } from "react";
import type { OperatorUser } from "@/lib/models";
import Login from "./Login";
import Dashboard from "./Dashboard";

const STORE_KEY = "operator_user";

export default function App() {
  const [user, setUser] = useState<OperatorUser | null>(() => {
    const stored = localStorage.getItem(STORE_KEY);
    return stored ? (JSON.parse(stored) as OperatorUser) : null;
  });

  const handleLogin = (u: OperatorUser) => {
    localStorage.setItem(STORE_KEY, JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORE_KEY);
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}
