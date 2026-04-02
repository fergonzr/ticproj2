import { renderHook, act } from "@testing-library/react-native";
import { useEmergencyList } from "./useEmergencyList";
import { SafeEmergency } from "@/lib/models";

function makeEmergency(id: string, reportedOn: string): SafeEmergency {
  return {
    id,
    alert: { reportedOn, medicalInfo: null, location: null },
    assignedTo: null,
    status: "RECEIVED",
    triage: null,
    timeline: {},
  };
}

describe("useEmergencyList", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useEmergencyList());
    expect(result.current.emergencyList).toHaveLength(0);
    expect(result.current.selectedId).toBeNull();
  });

  it("upsertEmergency adds a new emergency", () => {
    const { result } = renderHook(() => useEmergencyList());
    act(() => {
      result.current.upsertEmergency(makeEmergency("e1", "2026-04-01T10:00:00Z"));
    });
    expect(result.current.emergencyList).toHaveLength(1);
    expect(result.current.emergencies.get("e1")?.status).toBe("RECEIVED");
  });

  it("upsertEmergency updates an existing emergency", () => {
    const { result } = renderHook(() => useEmergencyList());
    act(() => {
      result.current.upsertEmergency(makeEmergency("e1", "2026-04-01T10:00:00Z"));
    });
    act(() => {
      result.current.upsertEmergency({
        ...makeEmergency("e1", "2026-04-01T10:00:00Z"),
        status: "TRIAGED",
      });
    });
    expect(result.current.emergencies.get("e1")?.status).toBe("TRIAGED");
    expect(result.current.emergencyList).toHaveLength(1);
  });

  it("emergencyList is sorted oldest first", () => {
    const { result } = renderHook(() => useEmergencyList());
    act(() => {
      result.current.upsertEmergency(makeEmergency("e2", "2026-04-01T11:00:00Z"));
      result.current.upsertEmergency(makeEmergency("e1", "2026-04-01T10:00:00Z"));
    });
    expect(result.current.emergencyList[0].id).toBe("e1");
    expect(result.current.emergencyList[1].id).toBe("e2");
  });

  it("selectEmergency updates selectedId and selectedEmergency", () => {
    const { result } = renderHook(() => useEmergencyList());
    act(() => {
      result.current.upsertEmergency(makeEmergency("e1", "2026-04-01T10:00:00Z"));
      result.current.selectEmergency("e1");
    });
    expect(result.current.selectedId).toBe("e1");
    expect(result.current.selectedEmergency?.id).toBe("e1");
  });

  it("selectedEmergency is null for unknown id", () => {
    const { result } = renderHook(() => useEmergencyList());
    act(() => { result.current.selectEmergency("nonexistent"); });
    expect(result.current.selectedEmergency).toBeNull();
  });
});
