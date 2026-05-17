import { useEffect, useRef, useState } from "react";
import { RealParamedicLocationWatcher, RealRouteProvider } from "@/lib/api/real";
import { haversineMeters } from "@/lib/utils/geo";
import type { OperatorEmergency } from "@/lib/api/interfaces";
import type { GeoLocation, RoutePoint } from "@/lib/models";

/** Maximum distance the paramedic can move before we re-fetch the route.
 *  Avoids hammering the routing service on every ~1 Hz GPS tick. */
const ROUTE_REFRESH_METERS = 40;

export type TrackingStage =
  | "idle"                  // no assigned paramedic, or non-trackable state
  | "en-route-to-citizen"   // ASSIGNED → route paramedic → citizen
  | "on-site"               // ON_SITE → paramedic arrived, no route
  | "en-route-to-hospital"; // IN_TRANSFER → route paramedic → hospital

export interface DestinationPin {
  id: string;
  latitude: number;
  longitude: number;
  kind: "citizen" | "hospital";
  name: string;
}

export interface ParamedicTracking {
  stage: TrackingStage;
  paramedicLocation: GeoLocation | null;
  paramedicRoute: RoutePoint[] | null;
  destinationPin: DestinationPin | null;
  /** True while the paramedic is on site: the incident pin is hidden
   *  because the paramedic marker visually covers the same point. */
  hideEmergencyPin: boolean;
}

function deriveStage(emergency: OperatorEmergency | null): TrackingStage {
  if (!emergency || !emergency.assignedTo) return "idle";
  switch (emergency.state) {
    case "ASSIGNED":
      return "en-route-to-citizen";
    case "ON_SITE":
      return "on-site";
    case "IN_TRANSFER":
      return "en-route-to-hospital";
    default:
      return "idle";
  }
}

function deriveDestination(
  emergency: OperatorEmergency | null,
  stage: TrackingStage,
): DestinationPin | null {
  if (!emergency) return null;
  if (stage === "en-route-to-citizen" && emergency.location) {
    return {
      id: emergency.id,
      latitude: emergency.location.latitude,
      longitude: emergency.location.longitude,
      kind: "citizen",
      name: emergency.id,
    };
  }
  if (stage === "en-route-to-hospital" && emergency.transferedTo?.location) {
    return {
      id: emergency.transferedTo.id,
      latitude: emergency.transferedTo.location.latitude,
      longitude: emergency.transferedTo.location.longitude,
      kind: "hospital",
      name: emergency.transferedTo.name,
    };
  }
  return null;
}

export function useParamedicTracking(
  emergency: OperatorEmergency | null,
  token: string,
): ParamedicTracking {
  // Stable refs for the WS watcher and the routing client. Created once per
  // dashboard lifetime so we don't reopen connections on every render or
  // emergency switch.
  const watcherRef = useRef<RealParamedicLocationWatcher | null>(null);
  if (!watcherRef.current) {
    watcherRef.current = new RealParamedicLocationWatcher(token);
  }
  const routeProviderRef = useRef<RealRouteProvider | null>(null);
  if (!routeProviderRef.current) {
    routeProviderRef.current = new RealRouteProvider(token);
  }

  const [paramedicLocation, setParamedicLocation] = useState<GeoLocation | null>(null);
  const [paramedicRoute, setParamedicRoute] = useState<RoutePoint[] | null>(null);
  const lastRouteOriginRef = useRef<GeoLocation | null>(null);

  // Synchronous reset on emergency.id change.
  //
  // The spec requires that no render of a newly-selected emergency may
  // contain GPS data from the previous one. A `useEffect` cleanup would
  // run *between* renders, which means React could paint once with stale
  // state before the cleanup fires. The render-time `setState` pattern
  // (guarded by a ref so it doesn't loop) is React's documented solution
  // for "resetting state when a prop changes".
  const previousEmergencyIdRef = useRef<string | null>(null);
  const currentId = emergency?.id ?? null;
  if (currentId !== previousEmergencyIdRef.current) {
    previousEmergencyIdRef.current = currentId;
    setParamedicLocation(null);
    setParamedicRoute(null);
    lastRouteOriginRef.current = null;
  }

  // Subscribe to the assigned paramedic's GPS. The watcher dedupes by id,
  // and unsubscribing on cleanup tears down the per-paramedic listener
  // without closing the shared WS.
  const trackedParamedicId = emergency?.assignedTo?.id ?? null;
  useEffect(() => {
    if (!trackedParamedicId) return;
    const watcher = watcherRef.current!;
    watcher.subscribe(trackedParamedicId, (loc) => setParamedicLocation(loc));
    return () => watcher.unsubscribe(trackedParamedicId);
  }, [trackedParamedicId]);

  // Close the shared WS when the consuming component unmounts.
  useEffect(() => {
    return () => watcherRef.current?.disconnect();
  }, []);

  const stage = deriveStage(emergency);
  const destinationPin = deriveDestination(emergency, stage);

  // Refetch the route as the paramedic moves, gated to 40 m of movement so
  // we don't hammer the routing service on every ~1 Hz GPS tick. When the
  // destination is null (idle, on-site) we wipe any leftover polyline.
  const destLat = destinationPin?.latitude;
  const destLng = destinationPin?.longitude;
  useEffect(() => {
    if (!paramedicLocation || destLat == null || destLng == null) {
      setParamedicRoute(null);
      lastRouteOriginRef.current = null;
      return;
    }
    const last = lastRouteOriginRef.current;
    if (last && haversineMeters(last, paramedicLocation) < ROUTE_REFRESH_METERS) {
      return;
    }
    let cancelled = false;
    routeProviderRef
      .current!.getRoute(paramedicLocation, { latitude: destLat, longitude: destLng })
      .then((r) => {
        if (cancelled) return;
        lastRouteOriginRef.current = paramedicLocation;
        setParamedicRoute(r.points);
      })
      .catch((e) => {
        if (cancelled) return;
        console.warn("Operator route fetch failed", e);
      });
    return () => {
      cancelled = true;
    };
  }, [paramedicLocation, destLat, destLng]);

  // Reset the gate whenever the destination changes (ASSIGNED → IN_TRANSFER,
  // or the chosen hospital changes), so the next paramedic location forces
  // a fresh fetch instead of waiting for 40 m of movement.
  const destId = destinationPin?.id;
  useEffect(() => {
    lastRouteOriginRef.current = null;
  }, [destId]);

  return {
    stage,
    paramedicLocation,
    paramedicRoute,
    destinationPin,
    hideEmergencyPin: stage === "on-site",
  };
}
