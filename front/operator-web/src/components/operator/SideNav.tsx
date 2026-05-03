import * as str from "@/lib/strings";
import NavIcon, { type NavIconType } from "./NavIcon";

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

function navBtnCls(active: boolean, variant: "default" | "logout" = "default") {
  const bg = active ? "bg-op-nav-active" : "bg-transparent";
  const color =
    variant === "logout" ? "text-op-error" : active ? "text-white" : "text-op-nav-idle";
  return `w-10 h-10 rounded-[8px] border-0 flex items-center justify-center cursor-pointer transition-all p-0 ${bg} ${color}`;
}

export default function SideNav({ activeSection, assignedCount, onNavigate, onLogout }: Props) {
  const hasMine = assignedCount > 0;
  return (
    <div className="w-14 bg-op-nav flex flex-col items-center py-[14px] gap-1 shrink-0">
      <div className="w-[34px] h-[34px] rounded-[8px] bg-op-primary flex items-center justify-center text-white font-bold text-[12px] mb-4 tracking-[-0.5px]">
        SIE
      </div>

      <button
        type="button"
        title={str.navTooltipQueue}
        onClick={() => onNavigate("queue")}
        className={navBtnCls(activeSection === "queue")}
      >
        <NavIcon type="alerts" size={18} />
      </button>

      <button
        type="button"
        title={hasMine ? `${str.navTooltipMyAlerts} (${assignedCount})` : str.navTooltipMyAlerts}
        onClick={() => hasMine && onNavigate("myAlerts")}
        disabled={!hasMine}
        className={`${navBtnCls(activeSection === "myAlerts")} relative ${hasMine ? "opacity-100 cursor-pointer" : "opacity-45 cursor-not-allowed"}`}
      >
        <NavIcon type="myAlerts" size={18} />
        {hasMine && (
          <span className="absolute top-[2px] right-[2px] min-w-4 h-4 px-1 rounded-[8px] bg-op-error text-white text-[10px] font-bold leading-4 text-center pointer-events-none [font-variant-numeric:tabular-nums]">
            {assignedCount > 9 ? "9+" : assignedCount}
          </span>
        )}
      </button>

      {SECONDARY_ITEMS.map((it) => (
        <button
          key={it.key}
          type="button"
          title={it.title}
          onClick={() => onNavigate(it.key)}
          className={navBtnCls(activeSection === it.key)}
        >
          <NavIcon type={it.icon} size={18} />
        </button>
      ))}

      <div className="flex-1" />
      <button
        type="button"
        title={str.navTooltipSettings}
        onClick={() => onNavigate("settings")}
        className={navBtnCls(activeSection === "settings")}
      >
        <NavIcon type="settings" size={18} />
      </button>
      <button
        type="button"
        title={str.navTooltipLogout}
        onClick={onLogout}
        className={navBtnCls(false, "logout")}
      >
        <NavIcon type="logout" size={18} />
      </button>
    </div>
  );
}
