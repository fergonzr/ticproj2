import { ReactElement, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { useApi } from "../lib/api/useApi";
import { PQRSSubmission, PQRSSubmissionType } from "../lib/models";
import DropdownPicker from "../lib/components/DropdownPicker";
import * as str from "../lib/strings";
import SIEELogo from "@/lib/components/SieeLogo";

/**
 * Screen to allow users to submit PQRS (Petition, Queue, Request, Suggestion)
 *
 * @returns ReactElement
 */

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
  if (form.message.trim().length === 0)
    return str.validationPQRSMessageRequired;
  if (form.message.trim().length < 10)
    return str.validationPQRSMessageMinLength;
  return null;
}

export default function PQRS(): ReactElement {
  const router = useRouter();
  const { pqrsSubmissionSubmitter } = useApi();

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

  const handleCancel = () => {
    setForm(EMPTY_PQRS);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="bg-white flex-1"
    >
      <ScrollView className="px-6 pt-4 pb-10">
        <SIEELogo></SIEELogo>
        {/* Header */}
        <Text className="text-primary mt-4 font-bold italic text-3xl text-center mb-6">
          {str.pqrsTitle}
        </Text>

        {/* Form */}
        <View className="rounded-lg p-4 mb-4">
          {/* Type */}
          <View className="flex-col items-center mb-4">
            <Text className="text-black text-md mb-1">{str.pqrsTypeLabel}</Text>
            <DropdownPicker
              options={Object.keys(str.pqrsTypes)}
              displayValues={str.pqrsTypes}
              selected={form.type}
              onSelect={(key) => setField("type", key as PQRSSubmissionType)}
            />
          </View>

          {/* Phone */}
          <Text className="text-black text-sm mb-1">{str.pqrsPhoneLabel}</Text>
          <TextInput
            className="border border-gray rounded-md px-4 py-2 mb-4 bg-white text-black text-sm"
            value={form.phone}
            onChangeText={(v) => setField("phone", v)}
            placeholder={str.pqrsPhonePlaceholder}
            keyboardType="phone-pad"
          />

          {/* Message */}
          <Text className="text-black text-sm mb-1">
            {str.pqrsMessageLabel}
          </Text>
          <TextInput
            className="border border-gray rounded-md px-4 py-2 mb-4 bg-white min-h-[120px] text-black text-sm"
            value={form.message}
            onChangeText={(v) => setField("message", v)}
            multiline
            textAlignVertical="top"
            placeholder={str.pqrsMessagePlaceholder}
          />
        </View>

        {/* Action buttons */}
        <View className="flex-row justify-between mt-2 mb-6">
          <TouchableOpacity
            className="bg-dangerpale rounded-full py-2 px-8"
            onPress={handleCancel}
          >
            <Text className="text-danger font-semibold text-base">
              {str.btnCancel}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`bg-primarypale rounded-full py-2 px-8 ${submitting ? "opacity-50" : ""}`}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text className="text-primaryshade font-semibold text-base">
              {submitting ? str.pqrsBtnSubmitting : str.pqrsBtnSubmit}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
