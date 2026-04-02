import { render, screen, fireEvent } from "@testing-library/react-native";
import ControlBar from "./ControlBar";
import { SafeEmergency } from "@/lib/models";

function makeEmergency(status: string, triage: object | null = null): SafeEmergency {
  return {
    id: "em-1",
    alert: { reportedOn: "2026-04-01T10:00:00Z", medicalInfo: null, location: null },
    assignedTo: triage
      ? null
      : status === "ASSIGNED"
      ? { id: "p1", name: "Luis Gómez", userRole: "PARAMEDIC" }
      : null,
    status,
    triage: triage as any,
    timeline: {},
  };
}

describe("ControlBar", () => {
  const noop = jest.fn();

  it("shows placeholder text when no emergency is selected", () => {
    render(
      <ControlBar emergency={null} onCallCitizen={noop} onCallParamedic={noop}
        onCallHospital={noop} onOpenTriage={noop} onOpenEdit={noop}
        onAssignParamedic={noop} onCloseCase={noop} />
    );
    expect(screen.getByText(/Selecciona una alerta/)).toBeTruthy();
  });

  it("shows triage and edit buttons for RECEIVED status with no triage", () => {
    render(
      <ControlBar emergency={makeEmergency("RECEIVED")} onCallCitizen={noop}
        onCallParamedic={noop} onCallHospital={noop} onOpenTriage={noop}
        onOpenEdit={noop} onAssignParamedic={noop} onCloseCase={noop} />
    );
    expect(screen.getByText("Realizar triaje")).toBeTruthy();
    expect(screen.getByText("Editar Emergencia")).toBeTruthy();
  });

  it("calls onOpenTriage when 'Realizar triaje' is pressed", () => {
    const onOpenTriage = jest.fn();
    render(
      <ControlBar emergency={makeEmergency("RECEIVED")} onCallCitizen={noop}
        onCallParamedic={noop} onCallHospital={noop} onOpenTriage={onOpenTriage}
        onOpenEdit={noop} onAssignParamedic={noop} onCloseCase={noop} />
    );
    fireEvent.press(screen.getByText("Realizar triaje"));
    expect(onOpenTriage).toHaveBeenCalledTimes(1);
  });

  it("shows 'Asignar paramédico' button when triage is complete", () => {
    const triage = { dizziness: true, bleeding: false, blurred_vision: false,
      unconscious: false, difficulty_breathing: false, fracture: false,
      chest_pain: false, numbness_limbs: false };
    render(
      <ControlBar emergency={makeEmergency("TRIAGED", triage)} onCallCitizen={noop}
        onCallParamedic={noop} onCallHospital={noop} onOpenTriage={noop}
        onOpenEdit={noop} onAssignParamedic={noop} onCloseCase={noop} />
    );
    expect(screen.getByText("Asignar paramédico")).toBeTruthy();
  });

  it("shows 'En ruta' text and paramedic name for ASSIGNED status", () => {
    const e = {
      ...makeEmergency("ASSIGNED"),
      assignedTo: { id: "p1", name: "Luis Gómez", userRole: "PARAMEDIC" },
    };
    render(
      <ControlBar emergency={e} onCallCitizen={noop} onCallParamedic={noop}
        onCallHospital={noop} onOpenTriage={noop} onOpenEdit={noop}
        onAssignParamedic={noop} onCloseCase={noop} />
    );
    expect(screen.getByText(/En ruta/)).toBeTruthy();
    expect(screen.getByText(/Luis Gómez/)).toBeTruthy();
  });

  it("shows 'Cerrar caso' for ON_SITE status", () => {
    render(
      <ControlBar emergency={makeEmergency("ON_SITE")} onCallCitizen={noop}
        onCallParamedic={noop} onCallHospital={noop} onOpenTriage={noop}
        onOpenEdit={noop} onAssignParamedic={noop} onCloseCase={noop} />
    );
    expect(screen.getByText("Cerrar caso")).toBeTruthy();
  });
});
