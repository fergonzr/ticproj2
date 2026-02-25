import React, { ReactElement, useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import SIEELogo from "@/lib/components/SieeLogo";
import styles from "@/lib/styles/LoginScreen.styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Input } from "@rneui/themed";
import { Button } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import * as str from "@/lib/strings";

/**
 * Login Screen for paramedics
 * @returns ReactElement
 */
const LoginScreen = (): ReactElement => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const inserts = useSafeAreaInsets();
  const router = useRouter();

  const handleLogin = () => {
    // TODO: connect to useAuth hook
    console.log("Login with", email, password);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: inserts.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        <SIEELogo />

        <View style={styles.form}>
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

          <Button onPress={handleLogin}>{str.loginPrompt}</Button>
           {/* TODO: Remove test button */}
          <Button onPress={() => router.push("/(paramedic)/Report")}>
            [TEST] look report
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
