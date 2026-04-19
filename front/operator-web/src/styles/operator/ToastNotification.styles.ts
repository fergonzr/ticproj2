import type { CSSProperties } from "react";
import { operatorUiColors as U } from "@/lib/themes/Colors";

export const TOAST_ANIMATION_ID = "operator-toast-slide-in";

export const TOAST_KEYFRAMES = `
@keyframes ${TOAST_ANIMATION_ID} {
  0%   { transform: translateX(24px); opacity: 0; }
  60%  { transform: translateX(-4px); opacity: 1; }
  100% { transform: translateX(0);    opacity: 1; }
}
@keyframes ${TOAST_ANIMATION_ID}-progress {
  from { width: 100%; }
  to   { width: 0%; }
}
`;

export const styles: Record<string, CSSProperties> = {
  container: {
    position: "absolute",
    top: 20,
    right: 20,
    minWidth: 320,
    maxWidth: 400,
    background: U.surface,
    borderRadius: 12,
    boxShadow:
      "0 10px 28px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.08)",
    overflow: "hidden",
    zIndex: 200,
    border: "none",
    padding: 0,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    animation: `${TOAST_ANIMATION_ID} .32s cubic-bezier(.22,1.2,.36,1)`,
    display: "flex",
    flexDirection: "column",
  },
  body: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "14px 16px",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    color: U.text,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  message: {
    fontSize: 14,
    fontWeight: 500,
    color: U.text,
    lineHeight: 1.4,
    wordBreak: "break-word",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: U.textTer,
    fontSize: 18,
    lineHeight: 1,
    padding: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  progressTrack: {
    height: 3,
    background: "transparent",
    width: "100%",
  },
  progressFill: {
    height: "100%",
    animation: `${TOAST_ANIMATION_ID}-progress 4s linear forwards`,
  },
};
