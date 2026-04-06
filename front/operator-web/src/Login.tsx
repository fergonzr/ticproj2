import { useState, type FormEvent } from "react";
import type { OperatorUser } from "@/lib/models";
import { RealOperatorAuthenticator } from "@/lib/api/real";
import { InvalidCredentialsError } from "@/lib/api/errors";
import * as str from "@/lib/strings";
import { colors } from "@/lib/themes/Colors";

const auth = new RealOperatorAuthenticator();

type Props = { onLogin: (user: OperatorUser) => void };

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const user = await auth.login(email, password);
      onLogin(user);
    } catch (err) {
      setError(
        err instanceof InvalidCredentialsError
          ? str.alertInvalidCredentials
          : str.alertError,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={{ ...s.title, color: colors.primary }}>SIEE</h1>
        <p style={s.notice}>{str.operatorLoginNotice}</p>
        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>{str.labelEmail}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={str.placeholderOperatorEmail}
            required
            disabled={isLoading}
            style={s.input}
          />
          <label style={s.label}>{str.labelPassword}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={str.placeholderPassword}
            required
            disabled={isLoading}
            style={s.input}
          />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" disabled={isLoading} style={{ ...s.btn, background: colors.primary }}>
            {isLoading ? str.btnSending : str.loginPrompt}
          </button>
        </form>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: colors.surface,
  },
  card: {
    background: colors.white,
    borderRadius: 12,
    padding: "40px 48px",
    boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
    width: "100%",
    maxWidth: 420,
  },
  title: {
    textAlign: "center",
    fontSize: 32,
    fontWeight: 800,
    marginBottom: 4,
  },
  notice: {
    textAlign: "center",
    fontSize: 13,
    color: colors.grey4,
    marginBottom: 28,
    lineHeight: 1.5,
  },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  label: { fontSize: 14, fontWeight: 600, color: colors.text },
  input: {
    padding: "10px 14px",
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    fontSize: 15,
    outline: "none",
    marginBottom: 4,
  },
  error: { color: colors.error, fontSize: 14, margin: "4px 0 0" },
  btn: {
    marginTop: 8,
    padding: "12px",
    color: colors.white,
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
};
