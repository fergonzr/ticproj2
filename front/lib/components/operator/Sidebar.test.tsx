import { render, screen, fireEvent } from "@testing-library/react-native";
import Sidebar from "./Sidebar";
import { SafeEmergency, ParamedicLocation } from "@/lib/models";

const emergency: SafeEmergency = {
  id: "em-1",
  alert: {
    reportedOn: "2026-04-01T10:00:00Z",
    medicalInfo: {
      firstName: "Ana", lastName: "López", phone: "3009", documentType: "NATIONAL_ID",
      documentNumber: "1", age: "30", allergies: [], diseases: [],
      hasPacemaker: false, bloodType: "O_POSITIVE", dataConsent: true,
    },
    location: { latitude: 6.17, longitude: -75.59 },
  },
  assignedTo: null, status: "RECEIVED", triage: null, timeline: {},
};

const paramedic: ParamedicLocation = {
  id: "p-1",
  name: "Carlos Ruiz",
  location: { latitude: 6.18, longitude: -75.60 },
};

describe("Sidebar", () => {
  it("shows emergency cards in emergencies mode", () => {
    render(
      <Sidebar
        mode="emergencies"
        emergencies={[emergency]}
        selectedId={null}
        paramedics={[]}
        selectedEmergencyLocation={null}
        onSelectEmergency={jest.fn()}
        onAssignParamedic={jest.fn()}
        onChangeMode={jest.fn()}
      />
    );
    expect(screen.getByText("Ana López")).toBeTruthy();
  });

  it("shows paramedic rows in paramedics mode", () => {
    render(
      <Sidebar
        mode="paramedics"
        emergencies={[]}
        selectedId={null}
        paramedics={[paramedic]}
        selectedEmergencyLocation={null}
        onSelectEmergency={jest.fn()}
        onAssignParamedic={jest.fn()}
        onChangeMode={jest.fn()}
      />
    );
    expect(screen.getByText("Carlos Ruiz")).toBeTruthy();
  });

  it("calls onChangeMode when a tab is pressed", () => {
    const onChangeMode = jest.fn();
    render(
      <Sidebar
        mode="emergencies"
        emergencies={[]}
        selectedId={null}
        paramedics={[]}
        selectedEmergencyLocation={null}
        onSelectEmergency={jest.fn()}
        onAssignParamedic={jest.fn()}
        onChangeMode={onChangeMode}
      />
    );
    fireEvent.press(screen.getByText("Paramédicos"));
    expect(onChangeMode).toHaveBeenCalledWith("paramedics");
  });
});
