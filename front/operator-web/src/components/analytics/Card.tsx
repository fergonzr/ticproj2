import type { CSSProperties, ReactNode } from "react";

interface Props {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export default function Card({ title, subtitle, children, style, className = "" }: Props) {
  const hasHeader = Boolean(title || subtitle);
  return (
    <div className={`bg-op-surface rounded-[10px] border border-op-border p-4 ${className}`} style={style}>
      {hasHeader && (
        <div className="flex justify-between items-center mb-3">
          {title    && <span className="text-[13px] font-bold text-op-text">{title}</span>}
          {subtitle && <span className="text-[11px] font-medium text-op-text-ter">{subtitle}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
