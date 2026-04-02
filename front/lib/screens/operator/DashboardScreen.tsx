import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useOperatorWS } from "@/lib/hooks/operator/useOperatorWS";
import { useTriageForm } from "@/lib/hooks/operator/useTriageForm";
import { useOperatorUser } from "@/lib/hooks/operator/useOperatorUser";
import { EditEmergencyFormData } from "@/lib/models";
import Topbar from "@/lib/components/operator/Topbar";
import Sidebar from "@/lib/components/operator/Sidebar";
import OperatorMapView from "@/lib/components/operator/OperatorMapView";
import ControlBar from "@/lib/components/operator/ControlBar";
import TriageModal from "@/lib/components/operator/TriageModal";
import EditEmergencyModal from "@/lib/components/operator/EditEmergencyModal";
import ToastNotification from "@/lib/components/operator/ToastNotification";

const EMPTY_EDIT_FORM: EditEmergencyFormData = {
  fullName: "",
  estimatedAge: "",
  knownConditions: "",
  observations: "",
};

export default function DashboardScreen() {
  const { operatorUser } = useOperatorUser();
  const host = process.env.EXPO_PUBLIC_API_HOST ?? "localhost:7999";

  const ws = useOperatorWS({
    host,
    token: operatorUser?.token ?? "",
  });

  const triageForm = useTriageForm();

  const [editForm, setEditForm] = useState<EditEmergencyFormData>(EMPTY_EDIT_FORM);

  function handleSendTriage() {
    if (!ws.selectedId) return;
    const payload = triageForm.toPayload(ws.selectedId);
    ws.sendTriage(payload.emergencyId, payload.triage);
    triageForm.reset();
  }

  function handleOpenTriage() {
    triageForm.reset();
    ws.openTriageModal();
  }

  function handleOpenEdit() {
    setEditForm(EMPTY_EDIT_FORM);
    ws.openEditModal();
  }

  function handleSaveEdit() {
    // TODO: send to backend endpoint POST /api/v1/emergencies/:id/enrich when available
    ws.closeEditModal();
  }

  const selectedLoc = ws.selectedEmergency?.alert.location ?? null;

  return (
    <View style={styles.root}>
      <Topbar operatorName={operatorUser?.name ?? ""} />

      <View style={styles.body}>
        <Sidebar
          mode={ws.sidebarMode}
          emergencies={ws.emergencyList}
          selectedId={ws.selectedId}
          paramedics={ws.paramedics}
          selectedEmergencyLocation={selectedLoc}
          onSelectEmergency={ws.selectEmergency}
          onAssignParamedic={ws.assignParamedic}
          onChangeMode={ws.setSidebarMode}
        />

        <View style={styles.main}>
          <View style={styles.mapArea}>
            <OperatorMapView
              emergencies={ws.emergencyList}
              hospitals={ws.hospitals}
              paramedics={ws.paramedics}
              routePoints={null}
            />
            <ToastNotification toast={ws.toast} onDismiss={ws.dismissToast} />
          </View>

          <ControlBar
            emergency={ws.selectedEmergency}
            onCallCitizen={() => {}}
            onCallParamedic={() => {}}
            onCallHospital={() => {}}
            onOpenTriage={handleOpenTriage}
            onOpenEdit={handleOpenEdit}
            onAssignParamedic={() => ws.setSidebarMode("paramedics")}
            onCloseCase={() => {}}
          />
        </View>
      </View>

      <TriageModal
        isOpen={ws.triageModalOpen}
        emergencyId={ws.selectedId ?? ""}
        form={triageForm.form}
        onSetField={triageForm.setField}
        onSubmit={handleSendTriage}
        onCancel={ws.closeTriageModal}
      />

      <EditEmergencyModal
        isOpen={ws.editModalOpen}
        form={editForm}
        onSetField={(field, value) =>
          setEditForm((prev) => ({ ...prev, [field]: value }))
        }
        onSubmit={handleSaveEdit}
        onCancel={ws.closeEditModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, flexDirection: "row" },
  main: { flex: 1, flexDirection: "column" },
  mapArea: { flex: 1, position: "relative" },
});
