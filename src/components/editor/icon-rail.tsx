import { Layers, Database, LayoutGrid, FileText, Settings } from "lucide-react";
import type { RailTab } from "./editor-shell";

interface IconRailProps {
  activeTab: RailTab;
  onTabChange: (tab: RailTab) => void;
}

const TOP_ITEMS: Array<{ tab: RailTab; icon: React.ReactNode; title: string }> = [
  { tab: "layers", icon: <Layers size={16} />, title: "Layers" },
  { tab: "data", icon: <Database size={16} />, title: "Data sources" },
  { tab: "components", icon: <LayoutGrid size={16} />, title: "Components" },
];

const BOTTOM_ITEMS: Array<{ tab: RailTab; icon: React.ReactNode; title: string }> = [
  { tab: "pages", icon: <FileText size={16} />, title: "Pages" },
  { tab: "settings", icon: <Settings size={16} />, title: "Settings" },
];

export function IconRail({ activeTab, onTabChange }: IconRailProps) {
  return (
    <div
      style={{
        width: 52,
        height: "100%",
        background: "var(--color-background-primary)",
        borderRight: "0.5px solid var(--color-border-tertiary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "8px 0",
        gap: 2,
      }}
    >
      {TOP_ITEMS.map(({ tab, icon, title }) => (
        <RailButton
          key={tab}
          title={title}
          active={activeTab === tab}
          onClick={() => onTabChange(tab)}
        >
          {icon}
        </RailButton>
      ))}

      {/* Divider */}
      <div
        style={{
          width: 24,
          height: "0.5px",
          background: "var(--color-border-secondary)",
          margin: "4px 0",
          flexShrink: 0,
        }}
      />

      {BOTTOM_ITEMS.map(({ tab, icon, title }) => (
        <RailButton
          key={tab}
          title={title}
          active={activeTab === tab}
          onClick={() => onTabChange(tab)}
        >
          {icon}
        </RailButton>
      ))}
    </div>
  );
}

function RailButton({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: "var(--border-radius-md)",
        background: active ? "var(--color-background-secondary)" : "transparent",
        color: active ? "var(--color-text-primary)" : "var(--color-muted-foreground)",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-background-secondary)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}
