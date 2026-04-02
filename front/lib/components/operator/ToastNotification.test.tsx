import { render, screen, fireEvent } from "@testing-library/react-native";
import ToastNotification from "./ToastNotification";

const baseToast = { type: "PARAMEDIC_ACCEPTED" as const, message: "Paramédico Juan aceptó la emergencia" };

describe("ToastNotification", () => {
  it("renders nothing when toast is null", () => {
    const { toJSON } = render(
      <ToastNotification toast={null} onDismiss={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });

  it("renders the toast message when toast is set", () => {
    render(<ToastNotification toast={baseToast} onDismiss={jest.fn()} />);
    expect(screen.getByText(baseToast.message)).toBeTruthy();
  });

  it("calls onDismiss when pressed", () => {
    const onDismiss = jest.fn();
    render(<ToastNotification toast={baseToast} onDismiss={onDismiss} />);
    fireEvent.press(screen.getByText(baseToast.message));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
