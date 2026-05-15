// IP is read from .env (EXPO_PUBLIC_LAN_IP). Copy .env.example → .env and
// set the value to the PC's current LAN IP before each session.
// Windows: run `ipconfig` → "IPv4 Address" under your Wi-Fi adapter.
// The IP changes when the PC reconnects; set a static DHCP reservation to avoid this.

// `process` is available in Expo (Metro) and is inlined by Vite's define — declare it
// here so the operator-web tsconfig (which has no Node types) compiles without error.
declare const process: { env: Record<string, string | undefined> };

const ip = process.env.EXPO_PUBLIC_LAN_IP ?? "192.168.1.2";

export const BASE_URL = `http://${ip}:7999`;
export const WS_BASE_URL = `ws://${ip}:7999`;
