import { geocodeAddress } from "./geocoding";

describe("geocodeAddress", () => {
  const originalKey = process.env.EXPO_PUBLIC_MAPTILER_KEY;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_MAPTILER_KEY = "test-key";
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_MAPTILER_KEY = originalKey;
    jest.restoreAllMocks();
  });

  it("devuelve lista vacía para una query en blanco sin llamar a fetch", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    const results = await geocodeAddress("   ");
    expect(results).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("mapea los features de MapTiler invirtiendo lon/lat a {latitude, longitude}", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          { place_name: "Calle 38, Envigado", geometry: { coordinates: [-75.5901, 6.1714] } },
        ],
      }),
    } as Response);

    const results = await geocodeAddress("Calle 38");
    expect(results).toEqual([
      { label: "Calle 38, Envigado", location: { latitude: 6.1714, longitude: -75.5901 } },
    ]);
  });

  it("devuelve lista vacía cuando no hay key de MapTiler configurada", async () => {
    process.env.EXPO_PUBLIC_MAPTILER_KEY = "";
    const fetchSpy = jest.spyOn(global, "fetch");
    const results = await geocodeAddress("Calle 38");
    expect(results).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
