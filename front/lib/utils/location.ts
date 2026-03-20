import * as Location from "expo-location";
import { GeoLocation } from "@/lib/models";

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
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000,
      distanceInterval: 10,
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
