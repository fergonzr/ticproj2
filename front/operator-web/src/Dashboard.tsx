import { useCallback, useEffect, useRef, useState } from "react";
import type { OperatorEmergency } from "@/lib/api/interfaces";
import type { OperatorUser } from "@/lib/models";
import { RealOperatorService } from "@/lib/api/real";
import * as str from "@/lib/strings";

import type { TriageData } from "@/lib/api/interfaces";

import Topbar from "./components/operator/Topbar";
import Sidebar from "./components/operator/Sidebar";
import ControlBar from "./components/operator/ControlBar";
import OperatorMapView from "./components/operator/OperatorMapView";
import TriageModal from "./components/operator/TriageModal";
import EditEmergencyModal, {
  type EditEmergencyFormData,
} from "./components/operator/EditEmergencyModal";
import ToastNotification, {
  type ToastData,
} from "./components/operator/ToastNotification";
import type { ParamedicEntry } from "./components/operator/ParamedicRow";

import { useTriageForm } from "./hooks/operator/useTriageForm";
import { styles } from "./styles/operator/Dashboard.styles";

const EMPTY_EDIT_FORM: EditEmergencyFormData = {
  fullName: "",
  estimatedAge: "",
  knownConditions: "",
  observations: "",
};

type Props = { user: OperatorUser; onLogout: () => void };

export default function Dashboard({ user, onLogout }: Props) {
  const serviceRef = useRef(new RealOperatorService());
  const [emergencies, setEmergencies] = useState<OperatorEmergency[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarMode, setSidebarMode] = useState<"emergencies" | "paramedics">(
    "emergencies",
  );
  const [triageModalOpen, setTriageModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditEmergencyFormData>(EMPTY_EDIT_FORM);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [criticalById, setCriticalById] = useState<Record<string, boolean>>({});
  const [triageById, setTriageById] = useState<Record<string, TriageData | null>>({});

  const triageForm = useTriageForm();

  useEffect(() => {
    const svc = serviceRef.current;
    svc.connect(user.token, (event) => {
      switch (event.type) {
        case "initial_queue":
          setEmergencies(event.emergencies);
          break;
        case "emergency_received":
          setEmergencies((prev) => [...prev, event.emergency]);
          setToast({ type: "EMERGENCY_RECEIVED", message: str.operatorToastEmergencyReceived });
          break;
        case "emergency_triaged":
          setEmergencies((prev) =>
            prev.map((e) => (e.id === event.emergencyId ? { ...e, state: "TRIAGED" } : e)),
          );
          break;
        case "emergency_assigned":
          setEmergencies((prev) =>
            prev.map((e) => (e.id === event.emergencyId ? { ...e, state: "ASSIGNED" } : e)),
          );
          setToast({ type: "PARAMEDIC_ACCEPTED", message: str.operatorToastParamedicAccepted });
          break;
        case "emergency_arrived":
          setEmergencies((prev) =>
            prev.map((e) => (e.id === event.emergencyId ? { ...e, state: "ON_SITE" } : e)),
          );
          break;
        case "error":
          setErrorMsg(event.message);
          break;
      }
    });
    return () => svc.disconnect();
  }, [user.token]);

  const selectedEmergency =
    emergencies.find((e) => e.id === selectedId) ?? null;

  // Paramedic data is not yet exposed by the operator WS; keep an empty list
  // for the paramedic sidebar mode until the backend surface is added.
  const paramedics: ParamedicEntry[] = [];
  const paramedicCounts = { available: 0, onRoute: 0, outOfService: 0 };

  const handleOpenTriage = useCallback(() => {
    triageForm.reset();
    setTriageModalOpen(true);
  }, [triageForm]);

  const handleSendTriage = useCallback(() => {
    if (!selectedId) return;
    const payload = triageForm.toTriageData();
    serviceRef.current.triageEmergency(selectedId, payload);
    setCriticalById((prev) => ({ ...prev, [selectedId]: triageForm.isCritical() }));
    setTriageById((prev) => ({ ...prev, [selectedId]: payload }));
    setTriageModalOpen(false);
  }, [selectedId, triageForm]);

  const handleOpenEdit = useCallback(() => {
    setEditForm(EMPTY_EDIT_FORM);
    setEditModalOpen(true);
  }, []);

  const handleSaveEdit = useCallback(() => {
    // TODO: POST /api/v1/emergencies/:id/enrich when backend endpoint is ready
    setEditModalOpen(false);
  }, []);

  const handleAssignParamedic = useCallback(
    (paramedicId: string) => {
      if (!selectedId) return;
      serviceRef.current.assignParamedic(selectedId, paramedicId);
      setSidebarMode("emergencies");
    },
    [selectedId],
  );

  const triageCritical = selectedId ? (criticalById[selectedId] ?? null) : null;

  return (
    <div style={styles.root}>
      <Topbar
        operatorName={user.name}
        paramedicCounts={paramedicCounts}
        onLogout={onLogout}
      />

      {errorMsg && (
        <div style={styles.errorBanner}>
          <strong>{str.alertError}:</strong> {errorMsg}
          <button style={styles.dismissBtn} onClick={() => setErrorMsg(null)}>
            ×
          </button>
        </div>
      )}

      <div style={styles.body}>
        <Sidebar
          mode={sidebarMode}
          emergencies={emergencies}
          selectedId={selectedId}
          paramedics={paramedics}
          onSelectEmergency={setSelectedId}
          onAssignParamedic={handleAssignParamedic}
          onBackToEmergencies={() => setSidebarMode("emergencies")}
        />

        <div style={styles.main}>
          <div style={styles.mapArea}>
            <OperatorMapView
              emergencies={emergencies}
              triageById={triageById}
              selectedId={selectedId}
              onSelectEmergency={setSelectedId}
            />
            <ToastNotification toast={toast} onDismiss={() => setToast(null)} />
          </div>

          <ControlBar
            emergency={selectedEmergency}
            triageCritical={triageCritical}
            onCallCitizen={() => {}}
            onCallParamedic={() => {}}
            onCallHospital={() => {}}
            onOpenTriage={handleOpenTriage}
            onOpenEdit={handleOpenEdit}
            onAssignParamedic={() => setSidebarMode("paramedics")}
            onCloseCase={() => {}}
          />
        </div>
      </div>

      <TriageModal
        isOpen={triageModalOpen}
        form={triageForm.form}
        onSetField={triageForm.setField}
        onSubmit={handleSendTriage}
        onCancel={() => setTriageModalOpen(false)}
      />

      <EditEmergencyModal
        isOpen={editModalOpen}
        form={editForm}
        onSetField={(field, value) =>
          setEditForm((prev) => ({ ...prev, [field]: value }))
        }
        onSubmit={handleSaveEdit}
        onCancel={() => setEditModalOpen(false)}
      />
    </div>
  );
}
