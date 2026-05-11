import { ReactElement, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { mobileColors } from "@/lib/themes/mobileTokens";
import { ClinicalCard, Chip, PillButton } from "@/lib/components/cl";

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function ParamedicHospitalArrival(): ReactElement {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const [arrivalTime] = useState(new Date());
  const departureTime = new Date(arrivalTime.getTime() - 8 * 60 * 1000);
  const diffMin = Math.round((arrivalTime.getTime() - departureTime.getTime()) / 60000);

  const goToReport = () => {
    router.push("/(paramedic)/PrehospitalCareReport");
  };

  return (
    <View style={{ flex: 1, backgroundColor: mobileColors.bg }}>
      {/* Hero */}
      <View
        style={{
          paddingTop: top + 14,
          paddingHorizontal: 20,
          paddingBottom: 22,
          backgroundColor: mobileColors.primaryDeep,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute", inset: 0,
            backgroundColor: mobileColors.primary, opacity: 0.5,
          }}
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <View
            style={{
              width: 48, height: 48, borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Feather name="plus-square" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11, opacity: 0.8, fontWeight: "700", letterSpacing: 0.5,
                textTransform: "uppercase", color: "#fff", fontFamily: "Inter_700Bold",
              }}
            >
              Llegaste al hospital
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff", fontFamily: "Inter_900Black" }}>
              Centro médico
            </Text>
          </View>
          <Chip label={hhmm(arrivalTime)} tone="neutral" icon="clock" />
        </View>

        <View style={{ flexDirection: "row", gap: 24 }}>
          {[
            ["Salida", hhmm(departureTime)],
            ["Llegada", hhmm(arrivalTime)],
            ["Tiempo", `${diffMin} min`],
          ].map(([lbl, val]) => (
            <View key={lbl}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#fff", fontFamily: "Inter_800ExtraBold" }}>{val}</Text>
              <Text style={{ fontSize: 10, opacity: 0.8, fontWeight: "600", textTransform: "uppercase", color: "#fff", fontFamily: "Inter_600SemiBold" }}>{lbl}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: bottom + 24, gap: 14 }}
      >
        {/* Report status card */}
        <ClinicalCard>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Feather name="file-text" size={16} color={mobileColors.primary} />
            <Text style={{ flex: 1, fontSize: 13, fontWeight: "700", color: mobileColors.text, fontFamily: "Inter_700Bold" }}>
              Reporte de atención
            </Text>
            <Chip label="Pendiente" tone="urgent" icon="alert-triangle" />
          </View>
          <Text style={{ fontSize: 12, color: mobileColors.textMid, lineHeight: 18, fontFamily: "Inter_400Regular" }}>
            Completa el informe de atención prehospitalaria antes de cerrar el caso.
          </Text>
        </ClinicalCard>

        {/* Warning */}
        <View
          style={{
            flexDirection: "row", gap: 10,
            padding: 14,
            borderRadius: 14,
            backgroundColor: mobileColors.urgentBg,
            borderWidth: 1,
            borderColor: mobileColors.urgent,
          }}
        >
          <Feather name="info" size={16} color={mobileColors.urgent} />
          <Text style={{ flex: 1, fontSize: 12, fontWeight: "600", color: mobileColors.urgent, lineHeight: 17, fontFamily: "Inter_600SemiBold" }}>
            Una vez enviado no podrás editar el reporte. Revisa antes de enviar.
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <PillButton
          label="Completar reporte"
          icon="arrow-right"
          full
          size="lg"
          onPress={goToReport}
        />

        <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: "center", paddingVertical: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: mobileColors.textMid, fontFamily: "Inter_700Bold" }}>
            Volver
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
