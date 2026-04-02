import { render, screen, fireEvent } from "@testing-library/react-native";
import ParamedicRow from "./ParamedicRow";

const paramedic = {
  id: "p-1",
  name: "Juan García",
  location: { latitude: 6.17, longitude: -75.59 },
};

describe("ParamedicRow", () => {
  it("renders paramedic name", () => {
    render(<ParamedicRow paramedic={paramedic} distanceKm={1.4} onAssign={jest.fn()} />);
    expect(screen.getByText("Juan García")).toBeTruthy();
  });

  it("renders formatted distance when available", () => {
    render(<ParamedicRow paramedic={paramedic} distanceKm={1.4} onAssign={jest.fn()} />);
    expect(screen.getByText("1.4 km")).toBeTruthy();
  });

  it("renders '— km' when distance is null", () => {
    render(<ParamedicRow paramedic={paramedic} distanceKm={null} onAssign={jest.fn()} />);
    expect(screen.getByText("— km")).toBeTruthy();
  });

  it("calls onAssign with paramedic id when button pressed", () => {
    const onAssign = jest.fn();
    render(<ParamedicRow paramedic={paramedic} distanceKm={1.4} onAssign={onAssign} />);
    fireEvent.press(screen.getByText("Asignar"));
    expect(onAssign).toHaveBeenCalledWith("p-1");
  });
});
