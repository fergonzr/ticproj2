import { ReactElement, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useApi } from "@/lib/api/useApi";
import { useActiveEmergency } from "@/app/(paramedic)/_layout";
import { MedicalCenter } from "@/lib/models";
import * as str from "@/lib/strings";
import { mobileColors } from "@/lib/themes/mobileTokens";
import { SwipeBtn } from "@/lib/components/cl";

export default function MedicalCenterTransfer(): ReactElement {
  const router = useRouter();
  const { emergencyAssignmentListener } = useApi();
  const { activeEmergency } = useActiveEmergency();
  const { top, bottom } = useSafeAreaInsets();
  const [centers, setCenters] = useState<MedicalCenter[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!activeEmergency?.id) return;
    let cancelled = false;
    emergencyAssignmentListener
      .getMedicalCenterRecommendations(activeEmergency.id)
      .then((list) => {
        if (cancelled) return;
        setCenters(list);
        if (list.length > 0 && selectedId === null) setSelectedId(list[0].id);
      })
      .catch((e) => {
        if (cancelled) return;
        Alert.alert(str.alertError, str.transferLoadError);
        console.warn("Medical center fetch failed", e);
        setCenters([]);
      });
    return () => { cancelled = true; };
  }, [activeEmergency?.id, emergencyAssignmentListener, selectedId]);

  const selected = centers?.find((c) => c.id === selectedId) ?? null;

  const handleStartRoute = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await emergencyAssignmentListener.transferEmergency(selectedId);
      router.push({
        pathname: "/(paramedic)/ParamedicNavigating",
        params: { hospitalId: selectedId, hospitalName: selected?.name ?? "" },
      });
    } catch (e) {
      Alert.alert(str.alertError, String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1620" }}>
      {/* Uber-style dark top bar */}
      <View style={{ paddingTop: top + 8, paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={8}
            style={{
              width: 36, height: 36, borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.1)",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Feather name="chevron-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View
            style={{
              flex: 1, height: 42, borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.1)",
              paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8,
            }}
          >
            <Feather name="plus-square" size={16} color="#5EE0A0" />
            <Text style={{ flex: 1, fontSize: 14, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" }} numberOfLines={1}>
              {selected?.name ?? "Selecciona un centro médico"}
            </Text>
            <Feather name="edit-2" size={14} color="rgba(255,255,255,0.5)" />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8, paddingLeft: 46 }}>
          <Pill text={selected?.availableSlots !== undefined && selected?.availableSlots !== null ? `${selected.availableSlots} cupos` : "Cupos —"} />
          <Pill text={selected?.specialties.length ? selected.specialties[0] : "General"} />
          <Pill text="Recomendado" highlight />
        </View>
      </View>

      {/* Map placeholder (kept as gradient — actual map is on EmergencyBrowser only) */}
      <View style={{ flex: 1, backgroundColor: "#18262E" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", opacity: 0.6 }}>
          <Feather name="map" size={64} color="rgba(255,255,255,0.18)" />
          <Text style={{ marginTop: 10, color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "Inter_400Regular" }}>
            Selecciona un centro para visualizar la ruta
          </Text>
        </View>
      </View>

      {/* Bottom sheet */}
      <View
        style={{
          backgroundColor: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: bottom + 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.15,
          shadowRadius: 28,
          elevation: 12,
        }}
      >
        <View
          style={{
            width: 38, height: 4, borderRadius: 2,
            backgroundColor: mobileColors.border,
            alignSelf: "center", marginBottom: 12,
          }}
        />

        {centers === null ? (
          <View style={{ paddingVertical: 32, alignItems: "center" }}>
            <ActivityIndicator color={mobileColors.primary} />
          </View>
        ) : centers.length === 0 ? (
          <Text style={{ textAlign: "center", paddingVertical: 24, color: mobileColors.textSoft, fontFamily: "Inter_400Regular" }}>
            {str.transferEmptyState}
          </Text>
        ) : (
          <ScrollView style={{ maxHeight: 240 }} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
            {centers.map((mc) => {
              const active = selectedId === mc.id;
              return (
                <TouchableOpacity
                  key={mc.id}
                  onPress={() => setSelectedId(mc.id)}
                  activeOpacity={0.85}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 10,
                    padding: 12, paddingHorizontal: 14,
                    borderRadius: 14, borderWidth: 1.5,
                    borderColor: active ? mobileColors.primary : mobileColors.border,
                    backgroundColor: active ? mobileColors.primaryTint : "#fff",
                  }}
                >
                  <View
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      backgroundColor: active ? mobileColors.primary : mobileColors.bg,
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Feather name="plus-square" size={16} color={active ? "#fff" : mobileColors.textSoft} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: mobileColors.text, fontFamily: "Inter_700Bold" }} numberOfLines={1}>
                      {mc.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: mobileColors.textSoft, marginTop: 1, fontFamily: "Inter_400Regular" }} numberOfLines={1}>
                      {mc.specialties.length > 0 ? mc.specialties.slice(0, 2).join(" · ") : "Atención general"}
                      {mc.availableSlots !== null ? ` · ${mc.availableSlots} cupos` : ""}
                    </Text>
                  </View>
                  {active && <Feather name="check" size={18} color={mobileColors.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <SwipeBtn
          label="Desliza para iniciar ruta"
          icon="navigation"
          color={mobileColors.primary}
          disabled={!selectedId || submitting}
          onSwipeRight={handleStartRoute}
        />

        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 10, alignSelf: "center" }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: mobileColors.textMid, fontFamily: "Inter_700Bold" }}>
            o <Text style={{ color: mobileColors.primary }}>Paciente atendido en sitio</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Pill({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: highlight ? "rgba(94,224,160,0.2)" : "rgba(255,255,255,0.1)",
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: highlight ? "#5EE0A0" : "rgba(255,255,255,0.7)",
          fontFamily: "Inter_700Bold",
        }}
      >
        {text}
      </Text>
    </View>
  );
}
