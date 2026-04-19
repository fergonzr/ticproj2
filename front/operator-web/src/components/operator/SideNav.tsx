import * as str from "@/lib/strings";
import NavIcon, { type NavIconType } from "./NavIcon";
import { styles, navBtnStyle, badgeStyle } from "../../styles/operator/SideNav.styles";

export type OperatorSection =
  | "queue"
  | "myAlerts"
  | "hospitals"
  | "paramedics"
  | "analytics"
  | "history"
  | "settings";

interface Props {
  activeSection: OperatorSection;
  assignedCount: number;
  onNavigate: (section: OperatorSection) => void;
  onLogout: () => void;
}

const SECONDARY_ITEMS: { key: OperatorSection; icon: NavIconType; title: string }[] = [
  { key: "hospitals",  icon: "hospital",   title: str.navTooltipHospitals },
  { key: "paramedics", icon: "paramedics", title: str.navTooltipParamedics },
  { key: "analytics",  icon: "analytics",  title: str.navTooltipAnalytics },
  { key: "history",    icon: "history",    title: str.navTooltipHistory },
];

export default function SideNav({ activeSection, assignedCount, onNavigate, onLogout }: Props) {
  const hasMine = assignedCount > 0;
  return (
    <div style={styles.container}>
      <div style={styles.logo}>SIE</div>

      <button
        type="button"
        title={str.navTooltipQueue}
        onClick={() => onNavigate("queue")}
        style={navBtnStyle(activeSection === "queue")}
      >
        <NavIcon type="alerts" size={18} />
      </button>

      <button
        type="button"
        title={hasMine ? `${str.navTooltipMyAlerts} (${assignedCount})` : str.navTooltipMyAlerts}
        onClick={() => hasMine && onNavigate("myAlerts")}
        disabled={!hasMine}
        style={{
          ...navBtnStyle(activeSection === "myAlerts"),
          opacity: hasMine ? 1 : 0.45,
          cursor: hasMine ? "pointer" : "not-allowed",
          position: "relative",
        }}
      >
        <NavIcon type="myAlerts" size={18} />
        {hasMine && <span style={badgeStyle}>{assignedCount > 9 ? "9+" : assignedCount}</span>}
      </button>

      {SECONDARY_ITEMS.map((it) => (
        <button
          key={it.key}
          type="button"
          title={it.title}
          onClick={() => onNavigate(it.key)}
          style={navBtnStyle(activeSection === it.key)}
        >
          <NavIcon type={it.icon} size={18} />
        </button>
      ))}

      <div style={styles.spacer} />
      <button
        type="button"
        title={str.navTooltipSettings}
        onClick={() => onNavigate("settings")}
        style={navBtnStyle(activeSection === "settings")}
      >
        <NavIcon type="settings" size={18} />
      </button>
      <button
        type="button"
        title={str.navTooltipLogout}
        onClick={onLogout}
        style={navBtnStyle(false, "logout")}
      >
        <NavIcon type="logout" size={18} />
      </button>
    </div>
  );
}
