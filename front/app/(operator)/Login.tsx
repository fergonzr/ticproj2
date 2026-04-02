import { ReactElement, useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Input } from "@rneui/themed";
import SIEELogo from "@/lib/components/SieeLogo";
import AppButton from "@/lib/components/AppButton";
import { useApi } from "@/lib/api/useApi";
import { useOperatorUser } from "@/lib/hooks/operator/useOperatorUser";
import { InvalidCredentialsError } from "@/lib/api/errors";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";
import * as str from "@/lib/strings";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OperatorLogin(): ReactElement {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { operatorAuthenticator } = useApi();
  const { setOperatorUser } = useOperatorUser();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const user = await operatorAuthenticator.login(email, password);
      await setOperatorUser(user);
      router.replace("/(operator)/Dashboard");
    } catch (error) {
      const message =
        error instanceof InvalidCredentialsError
          ? str.alertInvalidCredentials
          : str.alertError;
      Alert.alert(str.alertError, message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <SIEELogo />
        <Text style={styles.subtitle}>{str.operatorLoginSubtitle}</Text>
        <View style={styles.form}>
          <Input
            label="Correo institucional"
            placeholder="operador@envigado.gov.co"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Contraseña"
            placeholder="••••••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <AppButton
            title={str.loginPrompt}
            loadingTitle={str.btnSending}
            loading={isLoading}
            onPress={handleLogin}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  subtitle: {
    textAlign: "center",
    color: colors.grey4,
    fontSize: 14,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  form: { width: "100%", alignItems: "center" },
});
