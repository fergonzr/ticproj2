import { render, screen, fireEvent } from "@testing-library/react-native";
import TriageModal from "./TriageModal";
import { TriageFormData } from "@/lib/models";

const emptyForm: TriageFormData = {
  dizziness: null, bleeding: null, blurred_vision: null, unconscious: null,
  difficulty_breathing: null, fracture: null, chest_pain: null, numbness_limbs: null,
};

const completeForm: TriageFormData = {
  dizziness: true, bleeding: false, blurred_vision: false, unconscious: false,
  difficulty_breathing: false, fracture: false, chest_pain: false, numbness_limbs: false,
};

describe("TriageModal", () => {
  it("renders nothing when isOpen is false", () => {
    const { toJSON } = render(
      <TriageModal isOpen={false} emergencyId="e1" form={emptyForm}
        onSetField={jest.fn()} onSubmit={jest.fn()} onCancel={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });

  it("renders all 8 questions when open", () => {
    render(
      <TriageModal isOpen={true} emergencyId="e1" form={emptyForm}
        onSetField={jest.fn()} onSubmit={jest.fn()} onCancel={jest.fn()} />
    );
    expect(screen.getByText("¿Se siente mareado?")).toBeTruthy();
    expect(screen.getByText("¿Hay sangrado visible?")).toBeTruthy();
    expect(screen.getByText("¿Dolor en el pecho?")).toBeTruthy();
  });

  it("calls onSetField with correct field and value when Sí pressed", () => {
    const onSetField = jest.fn();
    render(
      <TriageModal isOpen={true} emergencyId="e1" form={emptyForm}
        onSetField={onSetField} onSubmit={jest.fn()} onCancel={jest.fn()} />
    );
    // Press first "Sí" button (for dizziness)
    const siButtons = screen.getAllByText("Sí");
    fireEvent.press(siButtons[0]);
    expect(onSetField).toHaveBeenCalledWith("dizziness", true);
  });

  it("calls onCancel when Cancelar is pressed", () => {
    const onCancel = jest.fn();
    render(
      <TriageModal isOpen={true} emergencyId="e1" form={emptyForm}
        onSetField={jest.fn()} onSubmit={jest.fn()} onCancel={onCancel} />
    );
    fireEvent.press(screen.getByText("Cancelar"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onSubmit when form is complete and Enviar triaje pressed", () => {
    const onSubmit = jest.fn();
    render(
      <TriageModal isOpen={true} emergencyId="e1" form={completeForm}
        onSetField={jest.fn()} onSubmit={onSubmit} onCancel={jest.fn()} />
    );
    fireEvent.press(screen.getByText("Enviar triaje"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
