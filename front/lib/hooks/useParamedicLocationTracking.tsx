import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { GeoLocation } from "@/lib/models";
import { ParamedicLocationTracker } from "@/lib/api/interfaces";
import { useParamedicUser } from "./useParamedicUser";

/**
 * Configuration for paramedic location tracking
 */
type ParamedicLocationTrackingConfig = {
  /**
   * The location tracker implementation to use
   */
  locationTracker: ParamedicLocationTracker;

  /**
   * Update interval in milliseconds
   * @default 10000 (10 seconds)
   */
  updateIntervalMs?: number;

  /**
   * Minimum distance between updates in meters
   * @default 10 meters
   */
  distanceInterval?: number;

  /**
   * Location accuracy level
   * @default Location.Accuracy.Balanced
   */
  accuracy?: Location.Accuracy;
};

/**
 * Hook for tracking and reporting paramedic location
 *
 * This hook automatically starts location tracking when a paramedic user is available
 * and stops it when the user logs out or the component unmounts.
 */
export function useParamedicLocationTracking({
  locationTracker,
  updateIntervalMs = 10000,
  distanceInterval = 10,
  accuracy = Location.Accuracy.Balanced,
}: ParamedicLocationTrackingConfig) {
  const { paramedicUser } = useParamedicUser();
  const [isTracking, setIsTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Start/stop location tracking based on paramedic user availability
  useEffect(() => {
    const startTracking = async () => {
      if (!paramedicUser) {
        console.log("no paramedic user found");
        stopTracking();
        return;
      }

      try {
        // Check if location services are enabled
        const hasServicesEnabled = await Location.hasServicesEnabledAsync();
        if (!hasServicesEnabled) {
          throw new Error("Location services are not enabled");
        }

        // Request background permissions for continuous tracking
        const { status } = await Location.requestBackgroundPermissionsAsync();
        if (status !== "granted") {
          throw new Error("Location permission denied");
        }

        // Start watching position
        const subscription = await Location.watchPositionAsync(
          {
            accuracy,
            timeInterval: updateIntervalMs,
            distanceInterval,
            mayShowUserSettingsDialog: true,
          },
          async (location) => {
            try {
              const locationData: GeoLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              };

              setLastLocation(locationData);

              // Report location to the server
              await locationTracker.reportLocation(
                paramedicUser.id,
                locationData,
              );
            } catch (reportError) {
              console.error("Error reporting location:", reportError);
              setError("Failed to report location");
            }
          },
          (locationError) => {
            console.error("Location error:", locationError);
            setError(
              typeof locationError === "object" &&
                locationError !== null &&
                "message" in locationError
                ? (locationError as { message: string }).message
                : "Location error occurred",
            );
          },
        );

        setIsTracking(true);
        return subscription;
      } catch (startError) {
        // console.error("Error starting location tracking:", startError);
        setError(
          typeof startError === "object" &&
            startError !== null &&
            "message" in startError
            ? (startError as any).message
            : "Unknown error",
        );
        return null;
      }
    };

    const stopTracking = () => {
      setIsTracking(false);
      setLastLocation(null);
      setError(null);
    };

    // Start tracking if paramedic user is available
    let subscription: any = null;
    if (paramedicUser) {
      subscription = startTracking();
    }

    // Cleanup on unmount or when paramedic user changes
    return () => {
      if (subscription && typeof subscription.remove === "function") {
        subscription.remove();
      }
      stopTracking();
    };
  }, [
    paramedicUser,
    locationTracker,
    updateIntervalMs,
    distanceInterval,
    accuracy,
  ]);

  return {
    isTracking,
    lastLocation,
    error,
    paramedicUser,
  };
}
