import { ReactElement, useState } from "react";
import {
  Alert,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import SIEELogo from "@/lib/components/SieeLogo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input } from "@rneui/themed";
import { Button } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import * as str from "@/lib/strings";
import { useApi } from "@/lib/api/useApi";
import { useParamedicUser } from "@/lib/hooks/useParamedicUser";

/**
 * Login Screen for paramedics
 * @returns ReactElement
 */
const LoginScreen = (): ReactElement => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { paramedicAuthenticator } = useApi();
  const { setParamedicUser } = useParamedicUser();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const user = await paramedicAuthenticator.login(email, password);
      await setParamedicUser(user);
      router.replace("/(paramedic)/EmergencyBrowser");
    } catch (error) {
      Alert.alert(
        str.alertError,
        error instanceof Error ? error.message : str.alertError,
      );
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

        <View className="w-full items-center">
          <Input
            label="Correo"
            placeholder="javier.pelaez@envigado.gov.co"
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

          <Button onPress={handleLogin} disabled={isLoading}>
            {isLoading ? str.btnSending : str.loginPrompt}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
