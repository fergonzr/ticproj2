import { ReactElement, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  KeyboardAvoidingView,
  TouchableOpacity,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApi } from "@/lib/api/useApi";
import { PQRSSubmission, PQRSSubmissionType } from "@/lib/models";
import * as str from "@/lib/strings";
import { mobileColors, mobileRadii } from "@/lib/themes/mobileTokens";
import { AppBar, ClinicalCard, SectionLabel, PillButton } from "@/lib/components/cl";
import SIEELogo from "@/lib/components/SieeLogo";

type PQRSForm = {
  type: PQRSSubmissionType;
  phone: string;
  message: string;
};

const EMPTY_PQRS: PQRSForm = {
  type: PQRSSubmissionType.ERROR,
  phone: "",
  message: "",
};

function validatePQRSForm(form: PQRSForm): string | null {
  if (form.type === undefined) return str.validationPQRSTypeRequired;
  if (form.phone.trim().length === 0) return str.validationPQRSPhoneRequired;
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(form.phone.trim())) return str.validationPQRSPhoneDigits;
  if (form.message.trim().length === 0) return str.validationPQRSMessageRequired;
  if (form.message.trim().length < 10) return str.validationPQRSMessageMinLength;
  return null;
}

const TYPE_ICONS: Record<PQRSSubmissionType, keyof typeof Feather.glyphMap> = {
  [PQRSSubmissionType.ERROR]:      "alert-circle",
  [PQRSSubmissionType.QUESTION]:   "info",
  [PQRSSubmissionType.SUGGESTION]: "message-circle",
};

export default function PQRS(): ReactElement {
  const router = useRouter();
  const { pqrsSubmissionSubmitter } = useApi();
  const { bottom } = useSafeAreaInsets();

  const [form, setForm] = useState<PQRSForm>(EMPTY_PQRS);
  const [submitting, setSubmitting] = useState(false);

  const setField = <K extends keyof PQRSForm>(field: K, value: PQRSForm[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    const validationError = validatePQRSForm(form);
    if (validationError) {
      Alert.alert(str.alertError, validationError);
      return;
    }
    try {
      setSubmitting(true);
      const submission: PQRSSubmission = {
        type: form.type,
        phone: form.phone,
        message: form.message,
      };
      await pqrsSubmissionSubmitter.submitPQRS(submission);
      Alert.alert(str.alertPQRSSuccess, str.alertPQRSSuccessMessage);
      setForm(EMPTY_PQRS);
    } catch (error) {
      console.error("Error submitting PQRS:", error);
      Alert.alert(str.alertPQRSError, str.alertPQRSErrorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: mobileColors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AppBar
        title={str.pqrs}
        subtitle="Cuéntanos cómo te podemos ayudar"
        leading={
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="chevron-left" size={22} color={mobileColors.text} />
          </TouchableOpacity>
        }
        trailing={<SIEELogo size={36} />}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: bottom + 24, gap: 16 }}
      >
        {/* Type selector */}
        <View>
          <SectionLabel>Tipo de solicitud</SectionLabel>
          {[
            { type: PQRSSubmissionType.ERROR,      label: str.pqrsTypeError },
            { type: PQRSSubmissionType.QUESTION,   label: str.pqrsTypeQuestion },
            { type: PQRSSubmissionType.SUGGESTION, label: str.pqrsTypeSuggestion },
          ].map(({ type, label }) => {
            const active = form.type === type;
            return (
              <TouchableOpacity key={type} onPress={() => setField("type", type)}>
                <ClinicalCard
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    marginBottom: 8,
                    borderColor: active ? mobileColors.primary : mobileColors.border,
                    borderWidth: active ? 2 : 1,
                    backgroundColor: active ? mobileColors.primaryTint : mobileColors.surface,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: mobileColors.primarySoft,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name={TYPE_ICONS[type]} size={18} color={mobileColors.primaryDeep} />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      fontWeight: "700",
                      color: mobileColors.text,
                      fontFamily: "Inter_700Bold",
                    }}
                  >
                    {label}
                  </Text>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      borderWidth: 2,
                      borderColor: active ? mobileColors.primary : mobileColors.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {active && (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          backgroundColor: mobileColors.primary,
                        }}
                      />
                    )}
                  </View>
                </ClinicalCard>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Phone */}
        <View>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: mobileColors.textMid,
              marginBottom: 6,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            {str.pqrsPhoneLabel}
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
            <Feather name="phone" size={17} color={mobileColors.textSoft} />
            <TextInput
              style={{
                flex: 1,
                fontSize: 15,
                color: mobileColors.text,
                fontFamily: "Inter_400Regular",
              }}
              value={form.phone}
              onChangeText={(v) => setField("phone", v)}
              placeholder={str.pqrsPhonePlaceholder}
              placeholderTextColor={mobileColors.textSoft}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Message */}
        <View>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: mobileColors.textMid,
              marginBottom: 6,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            {str.pqrsMessageLabel}
          </Text>
          <TextInput
            style={{
              minHeight: 130,
              padding: 14,
              backgroundColor: mobileColors.surface,
              borderWidth: 1,
              borderColor: mobileColors.border,
              borderRadius: 14,
              fontSize: 14,
              color: mobileColors.text,
              lineHeight: 22,
              fontFamily: "Inter_400Regular",
              textAlignVertical: "top",
            }}
            value={form.message}
            onChangeText={(v) => setField("message", v)}
            multiline
            placeholder={str.pqrsMessagePlaceholder}
            placeholderTextColor={mobileColors.textSoft}
          />
          <Text
            style={{
              fontSize: 11,
              color: mobileColors.textSoft,
              marginTop: 6,
              textAlign: "right",
              fontFamily: "Inter_400Regular",
            }}
          >
            {form.message.length} / 500
          </Text>
        </View>

        <PillButton
          label={str.pqrsBtnSubmit}
          icon="send"
          full
          size="lg"
          loading={submitting}
          onPress={handleSubmit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
