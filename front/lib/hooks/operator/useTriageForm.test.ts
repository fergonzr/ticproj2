import { renderHook, act } from "@testing-library/react-native";
import { useTriageForm } from "./useTriageForm";

describe("useTriageForm", () => {
  it("starts with all fields null", () => {
    const { result } = renderHook(() => useTriageForm());
    expect(result.current.form.dizziness).toBeNull();
    expect(result.current.form.bleeding).toBeNull();
    expect(result.current.isComplete()).toBe(false);
  });

  it("setField updates a single field", () => {
    const { result } = renderHook(() => useTriageForm());
    act(() => { result.current.setField("dizziness", true); });
    expect(result.current.form.dizziness).toBe(true);
    expect(result.current.form.bleeding).toBeNull();
  });

  it("isComplete returns true only when all 8 fields are set", () => {
    const { result } = renderHook(() => useTriageForm());
    const fields = ["dizziness","bleeding","blurred_vision","unconscious",
      "difficulty_breathing","fracture","chest_pain","numbness_limbs"] as const;
    fields.forEach((f) => act(() => { result.current.setField(f, false); }));
    expect(result.current.isComplete()).toBe(true);
  });

  it("reset clears all fields back to null", () => {
    const { result } = renderHook(() => useTriageForm());
    act(() => { result.current.setField("dizziness", true); });
    act(() => { result.current.reset(); });
    expect(result.current.form.dizziness).toBeNull();
    expect(result.current.isComplete()).toBe(false);
  });

  it("toPayload returns emergencyId + all 8 boolean fields when complete", () => {
    const { result } = renderHook(() => useTriageForm());
    const fields = ["dizziness","bleeding","blurred_vision","unconscious",
      "difficulty_breathing","fracture","chest_pain","numbness_limbs"] as const;
    fields.forEach((f) => act(() => { result.current.setField(f, true); }));
    const payload = result.current.toPayload("emergency-123");
    expect(payload.emergencyId).toBe("emergency-123");
    expect(payload.triage.dizziness).toBe(true);
    expect(payload.triage.numbness_limbs).toBe(true);
  });

  it("toPayload throws if form is incomplete", () => {
    const { result } = renderHook(() => useTriageForm());
    expect(() => result.current.toPayload("e-1")).toThrow("incomplete");
  });
});
