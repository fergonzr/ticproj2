import type { CSSProperties, ReactNode } from "react";
import { styles } from "../../styles/analytics/Card.styles";

interface Props {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  style?: CSSProperties;
}

export default function Card({ title, subtitle, children, style }: Props) {
  const hasHeader = Boolean(title || subtitle);
  return (
    <div style={{ ...styles.root, ...style }}>
      {hasHeader && (
        <div style={styles.header}>
          {title   && <span style={styles.title}>{title}</span>}
          {subtitle && <span style={styles.subtitle}>{subtitle}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
