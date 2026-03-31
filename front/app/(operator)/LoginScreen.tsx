import { ReactElement, useState } from "react";
import {
  Alert,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
} from "react-native";
import SIEELogo from "@/lib/components/SieeLogo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input } from "@rneui/themed";
import AppButton from "@/lib/components/AppButton";
import { useRouter } from "expo-router";
import * as str from "@/lib/strings";
import { useApi } from "@/lib/api/useApi";
import { useOperatorUser } from "@/lib/hooks/useOperatorUser";
import { InvalidCredentialsError } from "@/lib/api/errors";

/**
 * Login screen for operators.
 */
export default function OperatorLoginScreen(): ReactElement {
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
      router.replace("/(operator)/OperatorDashboard");
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
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <SIEELogo />
        <Text className="text-gray-500 text-center text-sm mt-2">
          {str.operatorLoginNotice}
        </Text>

        <View className="w-full items-center">
          <Input
            label="Correo"
            placeholder="operador@envigado.gov.co"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Input
            label="Contraseña"
            placeholder="••••••••••••••••••••••••"
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
