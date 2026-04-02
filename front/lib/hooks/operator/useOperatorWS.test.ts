import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useOperatorWS } from "./useOperatorWS";

// ─── Mock WebSocket ───────────────────────────────────────────────────────────
const mockSend = jest.fn();
const wsInstances: any[] = [];

class MockWebSocket {
  url: string;
  send = mockSend;
  close = jest.fn();
  onmessage: ((e: { data: string }) => void) | null = null;
  onopen: (() => void) | null = null;
  onerror: ((e: any) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    wsInstances.push(this);
    setTimeout(() => this.onopen?.(), 0);
  }
}

(global as any).WebSocket = MockWebSocket;
(global as any).fetch = jest.fn().mockResolvedValue({
  json: jest.fn().mockResolvedValue([
    { id: "h1", name: "Hospital Central", latitude: 6.25, longitude: -75.56 },
  ]),
});

function simulateMessage(wsIndex: number, event: string, payload: object) {
  const ws = wsInstances[wsIndex];
  ws.onmessage?.({ data: JSON.stringify({ event, payload }) });
}

const baseEmergency = {
  id: "em-1",
  alert: { reportedOn: "2026-04-01T10:00:00Z", medicalInfo: null, location: null },
  assignedTo: null,
  status: "RECEIVED",
  triage: null,
  timeline: {},
};

describe("useOperatorWS", () => {
  beforeEach(() => {
    wsInstances.length = 0;
    mockSend.mockClear();
    (global.fetch as jest.Mock).mockClear();
  });

  it("on open sends SET_AVAILABILITY=true via coordinator WS", async () => {
    renderHook(() => useOperatorWS({ host: "localhost:7999", token: "tok" }));
    await waitFor(() => expect(mockSend).toHaveBeenCalled());
    const call = JSON.parse(mockSend.mock.calls[0][0]);
    expect(call).toEqual({ command: "SET_AVAILABILITY", payload: true });
  });

  it("EMERGENCY_RECEIVED adds to emergencyList", async () => {
    const { result } = renderHook(() =>
      useOperatorWS({ host: "localhost:7999", token: "tok" })
    );
    await waitFor(() => wsInstances.length >= 1);
    act(() => simulateMessage(0, "EMERGENCY_RECEIVED", baseEmergency));
    expect(result.current.emergencyList).toHaveLength(1);
    expect(result.current.emergencyList[0].id).toBe("em-1");
  });

  it("USER_GREET adds emergency and auto-selects it", async () => {
    const { result } = renderHook(() =>
      useOperatorWS({ host: "localhost:7999", token: "tok" })
    );
    await waitFor(() => wsInstances.length >= 1);
    act(() => simulateMessage(0, "USER_GREET", baseEmergency));
    expect(result.current.selectedId).toBe("em-1");
  });

  it("EMERGENCY_ASSIGNED shows toast with PARAMEDIC_ACCEPTED type", async () => {
    const { result } = renderHook(() =>
      useOperatorWS({ host: "localhost:7999", token: "tok" })
    );
    await waitFor(() => wsInstances.length >= 1);
    act(() => simulateMessage(0, "EMERGENCY_ASSIGNED", {
      ...baseEmergency,
      assignedTo: { id: "p1", name: "Juan García", userRole: "PARAMEDIC" },
      status: "ASSIGNED",
    }));
    expect(result.current.toast?.type).toBe("PARAMEDIC_ACCEPTED");
  });

  it("dismissToast clears toast", async () => {
    const { result } = renderHook(() =>
      useOperatorWS({ host: "localhost:7999", token: "tok" })
    );
    await waitFor(() => wsInstances.length >= 1);
    act(() => simulateMessage(0, "EMERGENCY_ASSIGNED", {
      ...baseEmergency,
      assignedTo: { id: "p1", name: "Juan", userRole: "PARAMEDIC" },
      status: "ASSIGNED",
    }));
    act(() => result.current.dismissToast());
    expect(result.current.toast).toBeNull();
  });

  it("loads hospitals from REST on mount", async () => {
    const { result } = renderHook(() =>
      useOperatorWS({ host: "localhost:7999", token: "tok" })
    );
    await waitFor(() => {
      expect(result.current.hospitals).toHaveLength(1);
      expect(result.current.hospitals[0].name).toBe("Hospital Central");
    });
  });

  it("selectEmergency sends SUBSCRIBE command", async () => {
    const { result } = renderHook(() =>
      useOperatorWS({ host: "localhost:7999", token: "tok" })
    );
    await waitFor(() => wsInstances.length >= 1);
    act(() => simulateMessage(0, "EMERGENCY_RECEIVED", baseEmergency));
    mockSend.mockClear();
    act(() => result.current.selectEmergency("em-1"));
    const call = JSON.parse(mockSend.mock.calls[0][0]);
    expect(call).toEqual({ command: "SUBSCRIBE", payload: "em-1" });
  });
});
