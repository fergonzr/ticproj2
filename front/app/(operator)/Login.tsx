import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useApi } from "@/lib/api/useApi";
import { useOperatorUser } from "@/lib/hooks/operator/useOperatorUser";
import { InvalidCredentialsError } from "@/lib/api/errors";
import { colors } from "@/lib/themes/Colors";
import * as str from "@/lib/strings";

export default function OperatorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const router = useRouter();
  const { operatorAuthenticator } = useApi();
  const { setOperatorUser } = useOperatorUser();

  const handleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const user = await operatorAuthenticator.login(email, password);
      await setOperatorUser(user);
      router.replace("/(operator)/Dashboard");
    } catch (err) {
      setError(
        err instanceof InvalidCredentialsError
          ? str.alertInvalidCredentials
          : str.alertError
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* ── Left branding panel ── */}
      <View style={styles.leftPanel}>
        <View style={styles.logoWrap}>
          <Image
            source={require("@/assets/images/SIEE_logo.jpg")}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.brandName}>SIEE</Text>
        <Text style={styles.brandFull}>Sistema Integrado{"\n"}de Emergencias</Text>
        <View style={styles.divider} />
        <Text style={styles.brandCity}>Alcaldía de Envigado</Text>
      </View>

      {/* ── Right form panel ── */}
      <View style={styles.rightPanel}>
        <View style={styles.formWrap}>
          <Text style={styles.formTitle}>{str.operatorLoginTitle}</Text>
          <Text style={styles.formSub}>{str.operatorLoginSubtitle}</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>Correo institucional</Text>
          <TextInput
            style={[styles.input, emailFocused && styles.inputFocused]}
            value={email}
            onChangeText={setEmail}
            placeholder="operador@envigado.gov.co"
            placeholderTextColor={colors.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={[styles.input, passwordFocused && styles.inputFocused]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••••••"
            placeholderTextColor={colors.placeholder}
            secureTextEntry
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
          />

          <TouchableOpacity
            style={[styles.btn, isLoading && styles.btnLoading]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnText}>{str.loginPrompt}</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footer}>
            SIEE · Envigado · {new Date().getFullYear()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f8fafb",
  },

  // ── Left panel ──
  leftPanel: {
    width: "42%",
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
  },
  logoWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  logoImg: {
    width: 90,
    height: 90,
  },
  brandName: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 4,
    marginBottom: 8,
  },
  brandFull: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "400",
    marginBottom: 28,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 1,
    marginBottom: 20,
  },
  brandCity: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // ── Right panel ──
  rightPanel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
  },
  formWrap: {
    width: "100%",
    maxWidth: 400,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  formSub: {
    fontSize: 14,
    color: colors.grey4,
    marginBottom: 32,
  },

  errorBox: {
    backgroundColor: "#fff2f2",
    borderWidth: 1,
    borderColor: "#ffcdd2",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: "500",
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.grey5,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.text,
    backgroundColor: "#fff",
    marginBottom: 20,
    outlineStyle: "none",
  } as any,
  inputFocused: {
    borderColor: colors.primary,
  },

  btn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  btnLoading: {
    opacity: 0.75,
  },
  btnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  footer: {
    marginTop: 32,
    textAlign: "center",
    fontSize: 11,
    color: colors.grey3,
    letterSpacing: 0.5,
  },
});