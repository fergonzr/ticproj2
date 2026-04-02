import { useRef, useEffect } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import { SafeEmergency, Hospital, ParamedicLocation, RoutePoint } from "@/lib/models";
import { OPERATOR_LEAFLET_HTML } from "@/lib/map/operatorLeafletHtml";
import { styles } from "@/lib/styles/operator/OperatorMapView.styles";

interface Props {
  emergencies: SafeEmergency[];
  hospitals: Hospital[];
  paramedics: ParamedicLocation[];
  routePoints: RoutePoint[] | null;
  selectedId: string | null;
  onSelectEmergency: (id: string) => void;
}

export default function OperatorMapView({
  emergencies,
  hospitals,
  paramedics,
  routePoints,
  selectedId,
  onSelectEmergency: _onSelectEmergency,
}: Props) {
  const webViewRef = useRef<WebView>(null);

  function post(msg: object) {
    webViewRef.current?.postMessage(JSON.stringify(msg));
  }

  useEffect(() => {
    const alerts = emergencies
      .filter((e) => e.alert.location)
      .map((e) => ({
        id: e.id,
        lat: e.alert.location!.latitude,
        lng: e.alert.location!.longitude,
        name: e.alert.medicalInfo
          ? `${e.alert.medicalInfo.firstName} ${e.alert.medicalInfo.lastName}`
          : "Paciente desconocido",
        status: e.status,
        triage: e.triage,
      }));
    post({ type: "UPDATE_ALERTS", alerts });
  }, [emergencies]);

  useEffect(() => {
    post({ type: "UPDATE_HOSPITALS", hospitals });
  }, [hospitals]);

  useEffect(() => {
    post({ type: "UPDATE_PARAMEDICS", paramedics });
  }, [paramedics]);

  useEffect(() => {
    post({ type: "UPDATE_ROUTE", points: routePoints });
  }, [routePoints]);

  useEffect(() => {
    if (selectedId) post({ type: "ZOOM_TO", id: selectedId });
  }, [selectedId]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: OPERATOR_LEAFLET_HTML }}
        style={styles.webView}
        originWhitelist={["*"]}
        javaScriptEnabled
      />
    </View>
  );
}
