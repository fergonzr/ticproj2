import { ReactElement, useState } from "react";
import {
  Alert,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as str from "@/lib/strings";
import { useApi } from "@/lib/api/useApi";
import { useParamedicUser } from "@/lib/hooks/useParamedicUser";
import { InvalidCredentialsError } from "@/lib/api/errors";
import { mobileColors, mobileRadii } from "@/lib/themes/mobileTokens";
import { ClinicalCard, PillButton } from "@/lib/components/cl";

const LoginScreen = (): ReactElement => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { top, bottom } = useSafeAreaInsets();
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
      style={{ flex: 1, backgroundColor: mobileColors.surface, paddingTop: top }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 24, paddingBottom: bottom + 32, gap: 0 }}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: mobileColors.border,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <Feather name="chevron-left" size={20} color={mobileColors.text} />
        </TouchableOpacity>

        {/* Logo */}
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            backgroundColor: mobileColors.primarySoft,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Feather name="plus-circle" size={32} color={mobileColors.primaryDeep} />
        </View>

        {/* Header */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: mobileColors.primary,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 6,
            fontFamily: "Inter_700Bold",
          }}
        >
          {str.paramedicMenuSectionTitle}
        </Text>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "900",
            color: mobileColors.text,
            letterSpacing: -0.6,
            lineHeight: 34,
            marginBottom: 10,
            fontFamily: "Inter_900Black",
          }}
        >
          {"Bienvenido,\nparamédico"}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: mobileColors.textMid,
            lineHeight: 20,
            marginBottom: 28,
            fontFamily: "Inter_400Regular",
          }}
        >
          {str.paramedicLoginNotice}
        </Text>

        {/* Email field */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: mobileColors.textMid, marginBottom: 6, fontFamily: "Inter_600SemiBold" }}>
            {str.labelEmail}
          </Text>
          <View
            style={{
              height: 46,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              backgroundColor: mobileColors.surface,
              borderWidth: 1,
              borderColor: mobileColors.border,
              borderRadius: mobileRadii.md,
              gap: 10,
            }}
          >
            <Feather name="mail" size={17} color={mobileColors.textSoft} />
            <TextInput
              style={{ flex: 1, fontSize: 15, color: mobileColors.text, fontFamily: "Inter_400Regular" }}
              value={email}
              onChangeText={setEmail}
              placeholder={str.placeholderParamedicEmail}
              placeholderTextColor={mobileColors.textSoft}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Password field */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: mobileColors.textMid, marginBottom: 6, fontFamily: "Inter_600SemiBold" }}>
            {str.labelPassword}
          </Text>
          <View
            style={{
              height: 46,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              backgroundColor: mobileColors.surface,
              borderWidth: 1,
              borderColor: mobileColors.border,
              borderRadius: mobileRadii.md,
              gap: 10,
            }}
          >
            <Feather name="lock" size={17} color={mobileColors.textSoft} />
            <TextInput
              style={{ flex: 1, fontSize: 15, color: mobileColors.text, fontFamily: "Inter_400Regular" }}
              value={password}
              onChangeText={setPassword}
              placeholder={str.placeholderPassword}
              placeholderTextColor={mobileColors.textSoft}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: mobileColors.primary, fontFamily: "Inter_700Bold" }}>
                {showPassword ? "Ocultar" : "Ver"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <PillButton
          label={str.loginPrompt}
          full
          size="lg"
          loading={isLoading}
          onPress={handleLogin}
        />

        <Text
          style={{
            textAlign: "center",
            fontSize: 12,
            color: mobileColors.textSoft,
            marginTop: 16,
            fontFamily: "Inter_400Regular",
          }}
        >
          ¿Problemas?{" "}
          <Text style={{ color: mobileColors.primary, fontWeight: "700" }}>
            Contáctanos
          </Text>
        </Text>

        {/* Security notice */}
        <ClinicalCard
          style={{
            flexDirection: "row",
            gap: 10,
            marginTop: 24,
            backgroundColor: mobileColors.primaryTint,
            borderColor: mobileColors.primarySoft,
          }}
        >
          <Feather name="shield" size={16} color={mobileColors.primaryDeep} />
          <Text
            style={{
              flex: 1,
              fontSize: 12,
              color: mobileColors.primaryDeep,
              fontWeight: "600",
              lineHeight: 18,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            Solo personal autorizado. Accesos registrados y auditados.
          </Text>
        </ClinicalCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
