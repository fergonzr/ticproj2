import { buildEmergencyCase } from "./real";
import { EmergencyStatus } from "../models";

describe("buildEmergencyCase", () => {
  it("parsea medicalInfo del paciente cuando el alert lo incluye", () => {
    const result = buildEmergencyCase({
      id: "emg-1",
      alert: {
        generatedOn: "2026-05-15T10:00:00.000Z",
        location: { latitude: 6.17, longitude: -75.59 },
        medicalInfo: {
          firstName: "Salomé",
          lastName: "Pulgarín",
          phone: "3001234567",
          bloodType: "O_POSITIVE",
          allergies: ["Asma"],
        },
      },
    });

    expect(result.id).toBe("emg-1");
    expect(result.medicalInfo.firstName).toBe("Salomé");
    expect(result.medicalInfo.lastName).toBe("Pulgarín");
    expect(result.medicalInfo.phone).toBe("3001234567");
    expect(result.medicalInfo.allergies).toEqual(["Asma"]);
    expect(result.location).toEqual({ latitude: 6.17, longitude: -75.59 });
    expect(result.emergencyState).toBe(EmergencyStatus.RECEIVED);
  });

  it("usa el fallback 'Paciente desconocido' cuando no hay medicalInfo (reporte de tercero)", () => {
    const result = buildEmergencyCase({
      id: "emg-2",
      alert: { location: { latitude: 6.17, longitude: -75.59 }, medicalInfo: null },
    });

    expect(result.medicalInfo.firstName).toBe("Paciente");
    expect(result.medicalInfo.lastName).toBe("desconocido");
    expect(result.medicalInfo.allergies).toEqual([]);
  });
});
