import * as Location from "expo-location";
import { GeoLocation } from "@/lib/models";

/**
 * Haversine distance in km between two geographic points.
 */
export function distanceKm(from: GeoLocation, to: GeoLocation): number {
  const R = 6371;
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.latitude * Math.PI) / 180) *
      Math.cos((to.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const LOCATION_TIMEOUT_MS = 15000;

/**
 * Gets the current location of the device.
 * @returns GeoLocation with latitude and longitude, or null if unavailable.
 */
export const getCurrentLocation = async (): Promise<GeoLocation | null> => {
  try {
    const hasServicesEnabled = await Location.hasServicesEnabledAsync();
    if (!hasServicesEnabled) {
      console.warn("Location services are not enabled");
      return null;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("Location permission denied");
      return null;
    }

    const locationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Location timeout")), LOCATION_TIMEOUT_MS);
    });

    const location = await Promise.race([locationPromise, timeoutPromise]);

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error("Error getting location:", error);
    return null;
  }
};
