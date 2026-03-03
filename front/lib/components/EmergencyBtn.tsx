import { useState, useRef, useEffect, ReactNode } from "react";
import { Pressable, Text, Animated, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { PressableProps } from "react-native-gesture-handler";
import { CountdownCircleTimer } from "react-native-countdown-circle-timer";
import * as Haptics from "expo-haptics";

/**
 * Props for the EmergencyBtn component
 * @property timeoutDelaySeconds seconds to wait before calling afterPress.
 * @property afterPress callback to call after the timeout is reached.
 * @property children the children of the button.
 */
interface EmergencyBtnProps extends PressableProps {
  timeoutDelaySeconds: number;
  afterPress: () => void;
  children: ReactNode;
}

/**
 * A button component that handles emergency reporting with a countdown timer.
 *
 * @param timeoutDelaySeconds - The number of seconds to wait before calling afterPress.
 * @param afterPress - The callback to call after the timeout is reached.
 * @param children - The children of the button.
 * @returns A React component.
 */
export default function EmergencyBtn({
  timeoutDelaySeconds,
  afterPress,
  children,
  ...props
}: EmergencyBtnProps) {
  const [isPressed, setIsPressed] = useState<boolean>(false);
  const [countdownIteration, setCountdownIteration] = useState<number>(0);

  /**
   * Starts the countdown timer.
   */
  const startCountdown = () => {
    setIsPressed(true);
  };

  /**
   * Resets the countdown timer.
   */
  const resetCountdown = () => {
    setCountdownIteration(countdownIteration + 1);
    setIsPressed(false);
  };

  const onComplete = () => {
    afterPress();
    resetCountdown();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <Pressable
      onPressIn={startCountdown}
      onPressOut={resetCountdown}
      {...props}
    >
      <CountdownCircleTimer
        isPlaying={isPressed}
        duration={timeoutDelaySeconds}
        key={countdownIteration}
        onComplete={onComplete}
        size="300"
        colors={["#FF0000"]}
      >
        {({ remainingTime }) =>
          isPressed ? (
            <Text className="text-4xl">{remainingTime}</Text>
          ) : (
            <View>{children}</View>
          )
        }
      </CountdownCircleTimer>
    </Pressable>
  );
}
