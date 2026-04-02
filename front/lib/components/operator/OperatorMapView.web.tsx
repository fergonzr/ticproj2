import { useRef, useEffect } from "react";
import { View } from "react-native";
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
  onSelectEmergency,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Refs so the MAP_READY handler always sees current data
  const emergenciesRef = useRef(emergencies);
  const hospitalsRef = useRef(hospitals);
  const paramedicsRef = useRef(paramedics);
  const routePointsRef = useRef(routePoints);
  useEffect(() => { emergenciesRef.current = emergencies; }, [emergencies]);
  useEffect(() => { hospitalsRef.current = hospitals; }, [hospitals]);
  useEffect(() => { paramedicsRef.current = paramedics; }, [paramedics]);
  useEffect(() => { routePointsRef.current = routePoints; }, [routePoints]);

  function post(msg: object) {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), "*");
  }

  function sendAll() {
    const alerts = emergenciesRef.current
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
    post({ type: "UPDATE_HOSPITALS", hospitals: hospitalsRef.current });
    post({ type: "UPDATE_PARAMEDICS", paramedics: paramedicsRef.current });
    post({ type: "UPDATE_ROUTE", points: routePointsRef.current });
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

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "ALERT_CLICKED") onSelectEmergency(msg.id);
        if (msg.type === "MAP_READY") sendAll();
      } catch {}
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSelectEmergency]);

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        srcDoc={OPERATOR_LEAFLET_HTML}
        style={{ flex: 1, border: "none", width: "100%", height: "100%" }}
        sandbox="allow-scripts allow-same-origin"
        title="Operator Map"
      />
    </View>
  );
}