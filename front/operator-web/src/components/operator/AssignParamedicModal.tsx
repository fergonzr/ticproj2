import { useEffect, useState } from "react";
import * as str from "@/lib/strings";
import { BASE_URL } from "@/lib/api/config";
import AppButton from "./AppButton";

export interface ParamedicOption {
  id: string;
  name: string;
  email?: string;
  /** Distance hint from the backend recommendation, if available. */
  distanceKm?: number;
}

interface Props {
  isOpen: boolean;
  /** Required to fetch recommendations from the backend. */
  emergencyId: string | null;
  /** Operator JWT used to authorize the recommendation request. */
  token: string;
  onAssign: (paramedicId: string) => void;
  onCancel: () => void;
}

type BackendParamedic = {
  id: string;
  name: string;
  email: string;
  resource?: { location?: { latitude: number; longitude: number } };
};

export default function AssignParamedicModal({
  isOpen,
  emergencyId,
  token,
  onAssign,
  onCancel,
}: Props) {
  const [options, setOptions] = useState<ParamedicOption[] | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !emergencyId) return;
    let cancelled = false;
    setOptions(null);
    setErrorMsg(null);

    fetch(`${BASE_URL}/api/v1/paramedicRecommendation/${emergencyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<BackendParamedic[]>;
      })
      .then((list) => {
        if (cancelled) return;
        const mapped: ParamedicOption[] = list.map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email,
        }));
        setOptions(mapped);
        setSelectedId(mapped[0]?.id ?? "");
      })
      .catch((e) => {
        if (cancelled) return;
        console.warn("Paramedic recommendation fetch failed", e);
        setOptions([]);
        setErrorMsg(String(e?.message ?? e));
      });

    return () => { cancelled = true; };
  }, [isOpen, emergencyId, token]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-[100]"
      onClick={onCancel}
    >
      <div
        className="w-[420px] max-w-[90vw] bg-white rounded-[12px] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[16px] font-bold text-op-text mb-2 mt-0">
          {str.operatorAssignTitle}
        </h2>
        <p className="text-[12px] text-op-text-sec mb-5">
          Solo se listan paramédicos activos cercanos a la emergencia.
        </p>

        {options === null ? (
          <div className="py-8 text-center text-[13px] text-op-text-sec">
            Buscando paramédicos disponibles…
          </div>
        ) : options.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-op-text-sec">
            {errorMsg ?? "No hay paramédicos disponibles en este momento."}
          </div>
        ) : (
          <>
            <label className="block text-[11px] font-bold text-[#616161] tracking-[0.6px] uppercase mb-1">
              {str.operatorParamedicIdLabel}
            </label>
            <select
              className="w-full border border-op-border rounded-[6px] px-2 py-2 text-[13px] text-op-text mb-6 bg-white"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {options.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.email ? ` — ${p.email}` : ""}
                </option>
              ))}
            </select>
          </>
        )}

        <div className="flex flex-row justify-end gap-4">
          <AppButton title={str.btnCancel} onPress={onCancel} variant="outline" />
          <AppButton
            title={str.btnAssign}
            onPress={() => selectedId && onAssign(selectedId)}
            disabled={!selectedId || (options?.length ?? 0) === 0}
          />
        </div>
      </div>
    </div>
  );
}
