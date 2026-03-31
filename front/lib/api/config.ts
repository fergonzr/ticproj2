// Just two constants. Every other file imports from here.
// The IP is the PC's LAN IP so physical phones can reach it
// — localhost on a phone means the phone itself.
//
//  UPDATE THIS EVERY SESSION before running:
//   Windows: run `ipconfig` → look for "IPv4 Address" under your Wi-Fi adapter
//   The IP changes each time the PC reconnects or the DHCP lease renews.
//   To avoid this permanently, set a static DHCP reservation in your router (192.168.1.254).

export const BASE_URL = "http://192.168.1.7:7999";
export const WS_BASE_URL = "ws://192.168.1.7:7999";
