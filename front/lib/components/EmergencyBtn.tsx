import { useState, useRef, useEffect, ReactNode } from "react";
import { Pressable, Text } from "react-native";
import { PressableProps } from "react-native-gesture-handler";

/**
 * Props for the EmergencyBtn component
 * @property timeoutDelaySeconds seconds to wait before calling afterPress.
 * @property afterPress callback to call after the timeout is reached.
 * @property children the children of the button.
 */
interface EmergencyBtnProps extends PressableProps {
  timeoutDelaySeconds: number;
  afterPress: () => Promise<void>;
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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Starts the countdown timer.
   */
  const startCountdown = () => {
    setCountdown(timeoutDelaySeconds);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown === null || prevCountdown <= 1) {
          clearInterval(countdownIntervalRef.current as NodeJS.Timeout);
          setIsLoading(true);
          afterPress().then(() => {
            setIsLoading(false);
          });
          return null;
        }
        return prevCountdown - 1;
      });
    }, 1000);
  };

  /**
   * Resets the countdown timer.
   */
  const resetCountdown = () => {
    setCountdown(null);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  };

  /**
   * Cleans up the countdown interval when the component unmounts.
   */
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  return (
    <Pressable
      onPressIn={startCountdown}
      onPressOut={resetCountdown}
      {...props}
    >
      {countdown !== null && (
        <Text className="text-red-600 text-center text-4xl my-auto mx-16">
          {countdown}
        </Text>
      )}
      {countdown === null && children}
    </Pressable>
  );
}
