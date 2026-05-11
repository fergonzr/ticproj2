import { ReactElement } from "react";
import { LayoutChangeEvent, Text, View, ViewStyle } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Feather from "@expo/vector-icons/Feather";
import { mobileColors } from "@/lib/themes/mobileTokens";

const TRACK_HEIGHT = 62;
const HANDLE_SIZE = 46;
const HANDLE_MARGIN = (TRACK_HEIGHT - HANDLE_SIZE) / 2;
const TRIGGER_RATIO = 0.55;

type Props = {
  label: string;
  /** Main action color (right side) */
  color?: string;
  /** Left action color (only for bidirectional) */
  leftColor?: string;
  /** True for accept/reject bidirectional swipe (handle starts centered). */
  bidir?: boolean;
  /** Icon on the handle. Defaults to `arrow-right`. */
  icon?: keyof typeof Feather.glyphMap;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

/**
 * Swipe-to-confirm button — Uber-style. Unidirectional or bidirectional.
 * Handle resets after triggering so the parent can swap state.
 */
export default function SwipeBtn({
  label,
  color = mobileColors.primary,
  leftColor = mobileColors.critical,
  bidir = false,
  icon = "arrow-right",
  onSwipeRight,
  onSwipeLeft,
  disabled = false,
  style,
}: Props): ReactElement {
  const trackWidth = useSharedValue(0);
  const offset = useSharedValue(0);

  const onLayout = (e: LayoutChangeEvent) => {
    trackWidth.value = e.nativeEvent.layout.width;
  };

  const usableHalf = () => {
    "worklet";
    const w = trackWidth.value;
    return (w - HANDLE_SIZE - HANDLE_MARGIN * 2) / 2;
  };
  const usableFull = () => {
    "worklet";
    return Math.max(0, trackWidth.value - HANDLE_SIZE - HANDLE_MARGIN * 2);
  };

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onUpdate((e) => {
      if (bidir) {
        const half = usableHalf();
        offset.value = Math.max(-half, Math.min(half, e.translationX));
      } else {
        const full = usableFull();
        offset.value = Math.max(0, Math.min(full, e.translationX));
      }
    })
    .onEnd(() => {
      if (bidir) {
        const half = usableHalf();
        const threshold = half * TRIGGER_RATIO;
        if (offset.value > threshold && onSwipeRight) {
          offset.value = withTiming(half, { duration: 140 }, () => {
            runOnJS(onSwipeRight)();
            offset.value = withSpring(0, { damping: 18, stiffness: 200 });
          });
        } else if (offset.value < -threshold && onSwipeLeft) {
          offset.value = withTiming(-half, { duration: 140 }, () => {
            runOnJS(onSwipeLeft)();
            offset.value = withSpring(0, { damping: 18, stiffness: 200 });
          });
        } else {
          offset.value = withSpring(0, { damping: 18, stiffness: 200 });
        }
      } else {
        const full = usableFull();
        const threshold = full * TRIGGER_RATIO;
        if (offset.value > threshold && onSwipeRight) {
          offset.value = withTiming(full, { duration: 140 }, () => {
            runOnJS(onSwipeRight)();
            offset.value = withSpring(0, { damping: 18, stiffness: 200 });
          });
        } else {
          offset.value = withSpring(0, { damping: 18, stiffness: 200 });
        }
      }
    });

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const trackBg = bidir ? "#F1F3F5" : `${color}18`;
  const trackBorder = bidir ? "#E0E4E8" : `${color}40`;

  return (
    <View
      onLayout={onLayout}
      style={[
        {
          position: "relative",
          height: TRACK_HEIGHT,
          borderRadius: 999,
          backgroundColor: trackBg,
          borderWidth: 1.5,
          borderColor: trackBorder,
          overflow: "hidden",
          justifyContent: "center",
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {bidir && (
        <View
          style={{
            position: "absolute",
            left: 14,
            flexDirection: "row",
            alignItems: "center",
            opacity: 0.55,
          }}
        >
          <Feather name="chevron-left" size={14} color={leftColor} />
          <Feather name="chevron-left" size={14} color={leftColor} style={{ marginLeft: -8 }} />
        </View>
      )}

      <Text
        style={{
          textAlign: "center",
          fontSize: 14,
          fontWeight: "700",
          color: bidir ? "#4A5563" : color,
          letterSpacing: 0.2,
          fontFamily: "Inter_700Bold",
        }}
      >
        {label}
      </Text>

      <View
        style={{
          position: "absolute",
          right: 14,
          flexDirection: "row",
          alignItems: "center",
          opacity: 0.55,
        }}
      >
        <Feather name="chevron-right" size={14} color={color} />
        <Feather name="chevron-right" size={14} color={color} style={{ marginLeft: -8 }} />
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            {
              position: "absolute",
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              borderRadius: 999,
              backgroundColor: "#fff",
              shadowColor: "#000",
              shadowOpacity: 0.14,
              shadowOffset: { width: 0, height: 3 },
              shadowRadius: 10,
              elevation: 3,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: mobileColors.borderSoft,
              top: HANDLE_MARGIN,
              left: bidir ? "50%" : HANDLE_MARGIN,
              marginLeft: bidir ? -(HANDLE_SIZE / 2) : 0,
            },
            handleStyle,
          ]}
        >
          <Feather name={icon} size={18} color={color} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
