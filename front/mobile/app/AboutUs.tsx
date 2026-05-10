import { ReactElement } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import * as str from "@/lib/strings";
import { mobileColors, mobileRadii } from "@/lib/themes/mobileTokens";
import { AppBar, ClinicalCard, SectionLabel } from "@/lib/components/cl";
import SIEELogo from "@/lib/components/SieeLogo";

function ContactCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <ClinicalCard style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: mobileColors.primarySoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={icon} size={18} color={mobileColors.primaryDeep} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: mobileColors.textSoft, fontFamily: "Inter_400Regular" }}>
          {label}
        </Text>
        <Text style={{ fontSize: 15, fontWeight: "700", color: mobileColors.text, fontFamily: "Inter_700Bold" }}>
          {value}
        </Text>
      </View>
    </ClinicalCard>
  );
}

export default function AboutUs(): ReactElement {
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: mobileColors.bg }}>
      <AppBar title={str.aboutUsTitle} trailing={<SIEELogo size={36} />} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: bottom + 24 }}>
        {/* Hero gradient card */}
        <View
          style={{
            borderRadius: mobileRadii.lg,
            padding: 22,
            marginBottom: 20,
            backgroundColor: mobileColors.primaryDeep,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: mobileColors.primary,
              opacity: 0.5,
            }}
          />
          <Feather name="plus-circle" size={28} color="#fff" />
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: "#fff",
              letterSpacing: -0.4,
              marginTop: 14,
              fontFamily: "Inter_800ExtraBold",
            }}
          >
            SIEE Envigado
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.9)",
              marginTop: 6,
              lineHeight: 20,
              fontFamily: "Inter_400Regular",
            }}
          >
            {str.aboutUsDescription}
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 18,
              marginTop: 18,
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.15)",
              paddingTop: 16,
            }}
          >
            {[
              ["24/7", "Disponibilidad"],
              ["<6 min", "Tiempo medio"],
              ["12+", "Unidades"],
            ].map(([val, lbl]) => (
              <View key={lbl}>
                <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff", fontFamily: "Inter_800ExtraBold" }}>
                  {val}
                </Text>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" }}>
                  {lbl}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <SectionLabel>Contacto</SectionLabel>
        <ContactCard icon="phone" label="Línea directa" value={str.aboutUsPhoneNumber} />
        <ContactCard icon="home" label="Sede principal" value="Carrera 43 #38 Sur 20" />
        <ContactCard icon="mail" label="Correo" value="siee@envigado.gov.co" />

        <Text
          style={{
            textAlign: "center",
            fontSize: 11,
            color: mobileColors.textSoft,
            marginTop: 20,
            fontFamily: "Inter_400Regular",
          }}
        >
          v 2.4.0 · Alcaldía de Envigado © 2026
        </Text>
      </ScrollView>
    </View>
  );
}
