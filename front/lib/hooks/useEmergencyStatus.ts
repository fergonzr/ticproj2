import { useRef, useEffect, useState } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import * as str from "@/lib/strings";

const STATUS_NOTIFICATIONS: Record<string, { title: string; body: string }> = {
  RECEIVED:   { title: str.notificationReceivedTitle,   body: str.notificationReceivedBody },
  DISPATCHED: { title: str.notificationDispatchedTitle, body: str.notificationDispatchedBody },
  ON_ROUTE:   { title: str.notificationOnRouteTitle,    body: str.notificationOnRouteBody },
  ON_SITE:    { title: str.notificationOnSiteTitle,     body: str.notificationOnSiteBody },
  CLOSED:     { title: str.notificationClosedTitle,     body: str.notificationClosedBody },
  CANCELLED:  { title: str.notificationCancelledTitle,  body: str.notificationCancelledBody },
};

/** Color each status settles on after the twinkle ends. */
const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "#dc2626",   // red
  DISPATCHED: "#f97316", // orange
  ON_SITE: "#b2dbd5",    // primarypale (same as "Actualizar Datos" button)
  ON_ROUTE: "#FF0000",   // vivid red
  CLOSED: "#6b7280",     // gray
  CANCELLED: "#6b7280",  // gray
};

/** Color to alternate with during the twinkle — per status. */
const STATUS_TWINKLE_COLORS: Record<string, string> = {
  ON_SITE: "#166534", // darker green
};
const DEFAULT_TWINKLE_COLOR = "#facc15"; // yellow
const TWINKLE_INTERVAL_MS = 200;
const TWINKLE_ITERATIONS = 4; // full on-off cycles
const TWINKLE_DURATION_MS = TWINKLE_INTERVAL_MS * 2 * TWINKLE_ITERATIONS;

/**
 * Handles all user feedback when the emergency status changes:
 * haptic vibration, push notification, and a per-status twinkling color
 * for both the button text and the ring.
 *
 * @returns displayColor - current color string (use in both text and ring)
 * @returns onStatusChange - call whenever the emergency status updates
 */
export const useEmergencyStatus = () => {
  const [displayColor, setDisplayColor] = useState(STATUS_COLORS.RECEIVED);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(str.alertWarning, str.alertNotificationPermissionDenied, [
          { text: str.btnOK, style: "default" },
        ]);
      }
    })();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const onStatusChange = async (statusKey: string) => {
    const isFinal = statusKey === "CLOSED" || statusKey === "CANCELLED";
    const statusColor = STATUS_COLORS[statusKey] ?? STATUS_COLORS.RECEIVED;

    await Haptics.notificationAsync(
      isFinal
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success,
    );

    const notification = STATUS_NOTIFICATIONS[statusKey];
    if (notification) {
      await Notifications.scheduleNotificationAsync({
        content: { title: notification.title, body: notification.body },
        trigger: null,
      });
    }

    // Clear any previous twinkle
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const twinkleColor = STATUS_TWINKLE_COLORS[statusKey] ?? DEFAULT_TWINKLE_COLOR;

    // Start at the status color, then alternate with the twinkle color
    setDisplayColor(statusColor);
    let toggle = false;
    intervalRef.current = setInterval(() => {
      toggle = !toggle;
      setDisplayColor(toggle ? twinkleColor : statusColor);
    }, TWINKLE_INTERVAL_MS);

    // Settle back to the status color after all iterations
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayColor(statusColor);
    }, TWINKLE_DURATION_MS);
  };

  return { displayColor, onStatusChange };
};
