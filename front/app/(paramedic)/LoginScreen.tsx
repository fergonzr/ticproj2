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
import { useMedicalInfo } from "@/lib/api/useApi";
import { EmergencyCase, EmergencyStatus, MedicalInfo } from "@/lib/models";


//Just for demo
const EMPTY_MEDICAL_INFO: MedicalInfo = {
  nombre: "",
  apellidos: "",
  celular: "",
  tipoDocumento: "Cedula",
  documento: "",
  edad: "",
  alergias: { rinitis: false, asma: false, dermatitis: false },
  enfermedades: "Ninguna",
  marcaPasos: null,
  tipoSangre: "O+",
  autorizaDatos: null,
};


/**
 * Login Screen for paramedics
 * @returns ReactElement
 */
const LoginScreen = (): ReactElement => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const inserts = useSafeAreaInsets();
  const router = useRouter();

  //Just for demo
  const { medicalInfo } = useMedicalInfo();

  const handleLogin = () => {
    // TODO: connect to useAuth hook
    console.log("Login with", email, password);
  };

  // TODO: Remove — only for demo purposes
  const handleTestReport = () => {
    const mockCase: EmergencyCase = {
      reportedOn: new Date(),
      medicalInfo: medicalInfo ?? EMPTY_MEDICAL_INFO,
      location: { latitude: -4, longitude: 5 },
      emergencyState: EmergencyStatus.ON_SITE,
    };
    router.push({
      pathname: "/(paramedic)/Report",
      params: { emergencyCase: JSON.stringify(mockCase) },
    });
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
          <Button onPress={handleTestReport}>[TEST] look report</Button>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
