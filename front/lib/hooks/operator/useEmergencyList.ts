import { useState, useCallback } from "react";
import { SafeEmergency } from "@/lib/models";

export function useEmergencyList() {
  const [emergencies, setEmergencies] = useState<Map<string, SafeEmergency>>(
    new Map()
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const upsertEmergency = useCallback((emergency: SafeEmergency) => {
    setEmergencies((prev) => new Map(prev).set(emergency.id, emergency));
  }, []);

  const selectEmergency = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const emergencyList = Array.from(emergencies.values()).sort(
    (a, b) =>
      new Date(a.alert.reportedOn).getTime() -
      new Date(b.alert.reportedOn).getTime()
  );

  const selectedEmergency = selectedId
    ? (emergencies.get(selectedId) ?? null)
    : null;

  return {
    emergencies,
    emergencyList,
    selectedId,
    selectedEmergency,
    upsertEmergency,
    selectEmergency,
  };
}
