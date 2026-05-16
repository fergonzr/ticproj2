import { useEffect, useRef } from "react";
import { type OperatorEmergency, type TriageData, formatPatientName } from "@/lib/api/interfaces";
import { OPERATOR_LEAFLET_HTML } from "../../map/operatorLeafletHtml";

export interface Hospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface ParamedicLocation {
  id: string;
  name: string;
  location: { latitude: number; longitude: number };
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

interface Props {
  emergencies: OperatorEmergency[];
  hospitals?: Hospital[];
  paramedics?: ParamedicLocation[];
  routePoints?: RoutePoint[] | null;
  triageById?: Record<string, TriageData | null>;
  selectedId: string | null;
  focusAlertId?: string | null;
  onSelectEmergency: (id: string) => void;
}

export default function OperatorMapView({
  emergencies,
  hospitals = [],
  paramedics = [],
  routePoints = null,
  triageById = {},
  selectedId,
  focusAlertId = null,
  onSelectEmergency,
}: Props) {
  const visibleEmergencies = focusAlertId
    ? emergencies.filter((e) => e.id === focusAlertId)
    : emergencies;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const emergenciesRef = useRef(visibleEmergencies);
  const hospitalsRef = useRef(hospitals);
  const paramedicsRef = useRef(paramedics);
  const routePointsRef = useRef(routePoints);
  const triageRef = useRef(triageById);
  useEffect(() => { emergenciesRef.current = visibleEmergencies; }, [visibleEmergencies]);
  useEffect(() => { hospitalsRef.current = hospitals; }, [hospitals]);
  useEffect(() => { paramedicsRef.current = paramedics; }, [paramedics]);
  useEffect(() => { routePointsRef.current = routePoints; }, [routePoints]);
  useEffect(() => { triageRef.current = triageById; }, [triageById]);

  function post(msg: object) {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), "*");
  }

  // Emergencies whose location was never captured are kept in the sidebar list
  // but excluded here — placing a marker would drop a false pin at 0,0.
  function buildAlerts(list: OperatorEmergency[], triage: Record<string, TriageData | null>) {
    return list
      .filter((e) => e.location != null)
      .map((e) => ({
        id: e.id,
        lat: e.location!.latitude,
        lng: e.location!.longitude,
        name: formatPatientName(e),
        status: e.state,
        triage: triage[e.id] ?? null,
      }));
  }

  function sendAll() {
    post({ type: "UPDATE_ALERTS", alerts: buildAlerts(emergenciesRef.current, triageRef.current) });
    post({ type: "UPDATE_HOSPITALS", hospitals: hospitalsRef.current });
    post({ type: "UPDATE_PARAMEDICS", paramedics: paramedicsRef.current });
    post({ type: "UPDATE_ROUTE", points: routePointsRef.current });
  }

  useEffect(() => {
    post({ type: "UPDATE_ALERTS", alerts: buildAlerts(visibleEmergencies, triageById) });
  }, [visibleEmergencies, triageById]);

  useEffect(() => {
    if (focusAlertId) post({ type: "ZOOM_TO", id: focusAlertId });
  }, [focusAlertId]);

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
    <iframe
      ref={iframeRef}
      srcDoc={OPERATOR_LEAFLET_HTML}
      style={{ border: "none", width: "100%", height: "100%" }}
      sandbox="allow-scripts allow-same-origin"
      title="Operator Map"
    />
  );
}
