import { render, screen, fireEvent } from "@testing-library/react-native";
import EmergencyCard from "./EmergencyCard";
import { SafeEmergency } from "@/lib/models";

const emergency: SafeEmergency = {
  id: "em-1",
  alert: {
    reportedOn: "2026-04-01T10:30:00Z",
    medicalInfo: {
      firstName: "Carlos",
      lastName: "Pérez",
      phone: "3001234567",
      documentType: "NATIONAL_ID",
      documentNumber: "123",
      age: "40",
      allergies: [],
      diseases: [],
      hasPacemaker: false,
      bloodType: "O_POSITIVE",
      dataConsent: true,
    },
    location: { latitude: 6.17, longitude: -75.59 },
  },
  assignedTo: null,
  status: "RECEIVED",
  triage: null,
  timeline: {},
};

describe("EmergencyCard", () => {
  it("renders patient name when medicalInfo is present", () => {
    render(<EmergencyCard emergency={emergency} isSelected={false} onPress={jest.fn()} />);
    expect(screen.getByText("Carlos Pérez")).toBeTruthy();
  });

  it("renders 'Paciente desconocido' when medicalInfo is null", () => {
    render(
      <EmergencyCard
        emergency={{ ...emergency, alert: { ...emergency.alert, medicalInfo: null } }}
        isSelected={false}
        onPress={jest.fn()}
      />
    );
    expect(screen.getByText("Paciente desconocido")).toBeTruthy();
  });

  it("calls onPress with the emergency id when pressed", () => {
    const onPress = jest.fn();
    render(<EmergencyCard emergency={emergency} isSelected={false} onPress={onPress} />);
    fireEvent.press(screen.getByText("Carlos Pérez"));
    expect(onPress).toHaveBeenCalledWith("em-1");
  });
});
