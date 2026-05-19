import { ReactElement, useEffect, useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { mobileColors, mobileRadii } from "@/lib/themes/mobileTokens";
import PillButton from "./PillButton";

const DEFAULT_REASONS = [
  "Fuera de zona de cobertura",
  "Unidad en mantenimiento",
  "Capacidad máxima alcanzada",
  "Otra razón",
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (payload: { reason: string; notes: string }) => void;
  reasons?: string[];
  title?: string;
  confirmLabel?: string;
};

export default function RejectReasonSheet({
  visible,
  onClose,
  onConfirm,
  reasons = DEFAULT_REASONS,
  title = "¿Por qué rechazas?",
  confirmLabel = "Confirmar rechazo",
}: Props): ReactElement {
  const [selected, setSelected] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!visible) {
      setSelected(null);
      setNotes("");
    }
  }, [visible]);

  const canConfirm = selected !== null;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({ reason: reasons[selected], notes: notes.trim() });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(11,22,32,0.52)", justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 24,
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: mobileColors.border,
              alignSelf: "center",
              marginBottom: 16,
            }}
          />

          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: mobileColors.text,
              fontFamily: "Inter_800ExtraBold",
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: mobileColors.textMid,
              marginTop: 4,
              marginBottom: 16,
              fontFamily: "Inter_400Regular",
              lineHeight: 20,
            }}
          >
            Esta información ayuda al operador a reasignar la emergencia.
          </Text>

          {/* Reasons */}
          <View style={{ gap: 8, marginBottom: 16 }}>
            {reasons.map((r, i) => {
              const active = selected === i;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => setSelected(i)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: active ? mobileColors.primary : mobileColors.border,
                    backgroundColor: active ? mobileColors.primaryTint : "#fff",
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
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
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: "600",
                      color: mobileColors.text,
                      fontFamily: "Inter_600SemiBold",
                    }}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Optional notes */}
          <View style={{ marginBottom: 18 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: mobileColors.textMid,
                marginBottom: 6,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              Detalle adicional (opcional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Escribe aquí…"
              placeholderTextColor={mobileColors.textSoft}
              multiline
              style={{
                minHeight: 72,
                backgroundColor: mobileColors.bg,
                borderRadius: mobileRadii.md,
                borderWidth: 1,
                borderColor: mobileColors.border,
                padding: 12,
                fontSize: 13,
                color: mobileColors.text,
                fontFamily: "Inter_400Regular",
                textAlignVertical: "top",
              }}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              gap: 10,
              borderTopWidth: 1,
              borderTopColor: mobileColors.borderSoft,
              paddingTop: 14,
            }}
          >
            <PillButton label="Cancelar" variant="outline" size="lg" style={{ flex: 1 }} onPress={onClose} />
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!canConfirm}
              style={{
                flex: 1.4,
                height: 56,
                borderRadius: 999,
                backgroundColor: canConfirm ? mobileColors.critical : mobileColors.border,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
              }}
            >
              <Feather name="x" size={16} color="#fff" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" }}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
