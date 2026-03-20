import { useRef, useEffect } from "react";
import { Animated, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import * as str from "@/lib/strings";

const STATUS_NOTIFICATIONS: Record<string, { title: string; body: string }> = {
  RECEIVED: {
    title: "🚨 Emergency received",
    body: "We got your alert. Help is being arranged right now.",
  },
  DISPATCHED: {
    title: "⚡ Team dispatched",
    body: "A paramedic team has been assigned and is preparing to leave.",
  },
  ON_ROUTE: {
    title: "🚑 They're coming to you",
    body: "Paramedics are on their way. Stay where you are and keep calm.",
  },
  ON_SITE: {
    title: "✅ Help has arrived",
    body: "The paramedic team is now on site with you.",
  },
  CLOSED: {
    title: "💙 You're safe now",
    body: "The emergency has been resolved. Take care of yourself.",
  },
  CANCELLED: {
    title: "❌ Emergency cancelled",
    body: "This emergency case has been closed.",
  },
};

/**
 * Handles all user feedback when the emergency status changes:
 * haptic vibration, push notification, and animated text color flash.
 *
 * @returns textColor - Animated interpolation to pass to Animated.Text style
 * @returns onStatusChange - Call this whenever the emergency status updates
 */
export const useEmergencyStatus = () => {
  const colorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(str.alertWarning, str.alertNotificationPermissionDenied, [
          { text: str.btnOK, style: "default" },
        ]);
      }
    })();
  }, []);

  const textColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#dc2626", "#facc15"], // red → yellow
  });

  const onStatusChange = async (statusKey: string) => {
    const isFinal = statusKey === "CLOSED" || statusKey === "CANCELLED";

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

    colorAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(colorAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(colorAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]),
      { iterations: 4 },
    ).start();
  };

  return { textColor, onStatusChange };
};
