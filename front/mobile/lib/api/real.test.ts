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
    expect(result.medicalInfo.bloodType).toBe("O_POSITIVE");
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
    // No fabricated default — blood type stays unset for third-party reports.
    expect(result.medicalInfo.bloodType).toBe("");
  });

  it("extrae el triaje y el nivel de complejidad del payload", () => {
    const result = buildEmergencyCase({
      id: "emg-3",
      alert: { location: { latitude: 6.17, longitude: -75.59 }, medicalInfo: null },
      triage: { unconscious: true, chest_pain: true, bleeding: false },
      complexityLevel: 2,
    });

    expect(result.triage?.unconscious).toBe(true);
    expect(result.triage?.chest_pain).toBe(true);
    expect(result.triage?.bleeding).toBe(false);
    expect(result.complexityLevel).toBe(2);
  });

  it("deja triaje y complejidad nulos cuando el payload no los trae", () => {
    const result = buildEmergencyCase({
      id: "emg-4",
      alert: { location: { latitude: 6.17, longitude: -75.59 }, medicalInfo: null },
    });

    expect(result.triage).toBeNull();
    expect(result.complexityLevel).toBeNull();
  });

  it("defaults prehospitalCareReportSent to false when not provided", () => {
    const result = buildEmergencyCase({
      id: "emg-5",
      alert: { location: { latitude: 6.17, longitude: -75.59 }, medicalInfo: null },
    });

    expect(result.prehospitalCareReportSent).toBe(false);
  });

  it("parses prehospitalCareReportSent as true when provided", () => {
    const result = buildEmergencyCase({
      id: "emg-6",
      alert: { location: { latitude: 6.17, longitude: -75.59 }, medicalInfo: null },
      prehospitalCareReportSent: true,
    });

    expect(result.prehospitalCareReportSent).toBe(true);
  });

  it("parses prehospitalCareReportSent as true from truthy string value", () => {
    const result = buildEmergencyCase({
      id: "emg-7",
      alert: { location: { latitude: 6.17, longitude: -75.59 }, medicalInfo: null },
      prehospitalCareReportSent: "yes",
    });

    expect(result.prehospitalCareReportSent).toBe(true);
  });
});
