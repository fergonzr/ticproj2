import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import PersonSelector from "./PersonSelector";
import { MedicalInfo } from "@/lib/models";

const mockMedicalInfo1: MedicalInfo = {
  firstName: "John",
  lastName: "Doe",
  phone: "1234567890",
  documentType: "NATIONAL_ID",
  documentNumber: "12345",
  age: "30",
  allergies: { rhinitis: false, asthma: false, dermatitis: false },
  disease: "NONE",
  hasPacemaker: false,
  bloodType: "O_POSITIVE",
  dataConsent: true,
};

const mockMedicalInfo2: MedicalInfo = {
  firstName: "Jane",
  lastName: "Smith",
  phone: "9876543210",
  documentType: "PASSPORT",
  documentNumber: "67890",
  age: "25",
  allergies: { rhinitis: true, asthma: false, dermatitis: false },
  disease: "DIABETES",
  hasPacemaker: false,
  bloodType: "A_POSITIVE",
  dataConsent: true,
};

describe("PersonSelector component", () => {
  it("should render correctly with empty list", () => {
    const mockOnSelect = jest.fn();
    render(
      <PersonSelector
        medicalInfoList={[]}
        selectedPersonIndex={null}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText("Seleccionar persona")).toBeTruthy();
  });

  it("should render correctly with medical info list", () => {
    const mockOnSelect = jest.fn();
    render(
      <PersonSelector
        medicalInfoList={[mockMedicalInfo1, mockMedicalInfo2]}
        selectedPersonIndex={0}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText("John Doe")).toBeTruthy();
    expect(screen.getByText("Jane Smith")).toBeTruthy();
  });

  it("should call onSelect with correct index when person is selected", () => {
    const mockOnSelect = jest.fn();
    render(
      <PersonSelector
        medicalInfoList={[mockMedicalInfo1, mockMedicalInfo2]}
        selectedPersonIndex={null}
        onSelect={mockOnSelect}
      />
    );

    // Open dropdown
    fireEvent.press(screen.getByText("John Doe"));

    // Select second person
    fireEvent.press(screen.getByText("Jane Smith"));

    expect(mockOnSelect).toHaveBeenCalledWith(1);
  });

  it("should show third party option when enabled", () => {
    const mockOnSelect = jest.fn();
    render(
      <PersonSelector
        medicalInfoList={[mockMedicalInfo1]}
        selectedPersonIndex={null}
        onSelect={mockOnSelect}
        showThirdPartyOption={true}
      />
    );

    expect(screen.getByText("Un tercero")).toBeTruthy();
  });

  it("should call onSelect with null when third party is selected", () => {
    const mockOnSelect = jest.fn();
    render(
      <PersonSelector
        medicalInfoList={[mockMedicalInfo1]}
        selectedPersonIndex={null}
        onSelect={mockOnSelect}
        showThirdPartyOption={true}
      />
    );

    // Open dropdown
    fireEvent.press(screen.getByText("Un tercero"));

    // Select third party
    fireEvent.press(screen.getByText("Un tercero"));

    expect(mockOnSelect).toHaveBeenCalledWith(null);
  });

  it("should use custom label when provided", () => {
    const mockOnSelect = jest.fn();
    render(
      <PersonSelector
        medicalInfoList={[mockMedicalInfo1]}
        selectedPersonIndex={null}
        onSelect={mockOnSelect}
        label="Custom Label"
      />
    );

    expect(screen.getByText("Custom Label")).toBeTruthy();
  });

  it("should use custom third party label when provided", () => {
    const mockOnSelect = jest.fn();
    render(
      <PersonSelector
        medicalInfoList={[mockMedicalInfo1]}
        selectedPersonIndex={null}
        onSelect={mockOnSelect}
        showThirdPartyOption={true}
        thirdPartyLabel="Custom Third Party"
      />
    );

    expect(screen.getByText("Custom Third Party")).toBeTruthy();
  });
});
