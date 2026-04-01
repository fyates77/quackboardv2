import { useState, useRef, useEffect } from "react";
import {
  Home,
  BarChart3,
  Table2,
  Settings,
  Star,
  Info,
  File,
  Users,
  ArrowRight,
  LayoutDashboard,
  Database,
  Layers,
  Globe,
  Mail,
  Bell,
  Search,
  Bookmark,
  Tag,
  Folder,
  Calendar,
  Clock,
  Map,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Link,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInteractionStore } from "@/stores/interaction-store";
import { useDashboardStore } from "@/stores/dashboard-store";
import type { NavBarConfig, NavBarItem, NavBarIcon } from "@/types/dashboard";

// ─── Icon registry ─────────────────────────────────────────────────────────

const ICON_MAP: Record<NavBarIcon, LucideIcon> = {
  home: Home,
  "bar-chart": BarChart3,
  table: Table2,
  settings: Settings,
  star: Star,
  info: Info,
  file: File,
  users: Users,
  "arrow-right": ArrowRight,
  "layout-dashboard": LayoutDashboard,
  database: Database,
  layers: Layers,
  globe: Globe,
  mail: Mail,
  bell: Bell,
  search: Search,
  bookmark: Bookmark,
  tag: Tag,
  folder: Folder,
  calendar: Calendar,
  clock: Clock,
  map: Map,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  activity: Activity,
  "alert-triangle": AlertTriangle,
  "check-circle": CheckCircle,
  "x-circle": XCircle,
  link: Link,
};

function NavIcon({ name, size }: { name: NavBarIcon; size: number }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon style={{ width: size, height: size }} />;
}

// ─── Style helpers ─────────────────────────────────────────────────────────

function fontWeightClass(w?: NavBarConfig["fontWeight"]) {
  switch (w) {
    case "medium":
      return "font-medium";
    case "semibold":
      return "font-semibold";
    case "bold":
      return "font-bold";
    default:
      return "font-normal";
  }
}

function shadowForStyle(
  style: NavBarConfig["itemStyle"],
  isActive: boolean,
  cfg: NavBarConfig,
): React.CSSProperties {
  const color = isActive ? cfg.activeTextColor : cfg.textColor;
  const bg = isActive ? cfg.activeBgColor : undefined;
  switch (style) {
    case "pill":
      return {
        backgroundColor: isActive ? bg ?? "rgba(var(--color-primary), 0.15)" : undefined,
        borderRadius: cfg.borderRadius ?? 6,
        color,
      };
    case "bordered":
      return {
        border: isActive
          ? `1.5px solid ${cfg.activeBgColor ?? "currentColor"}`
          : "1.5px solid transparent",
        borderRadius: cfg.borderRadius ?? 6,
        color,
      };
    case "underline":
      return { color };
    default:
      return { color };
  }
}

// ─── Dropdown (horizontal mode) ────────────────────────────────────────────

function HorizontalDropdown({
  item,
  cfg,
  isChildActive,
  onNavigate,
}: {
  item: NavBarItem;
  cfg: NavBarConfig;
  isChildActive: (i: NavBarItem) => boolean;
  onNavigate: (i: NavBarItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const px = cfg.itemPaddingX ?? 12;
  const py = cfg.itemPaddingY ?? 6;
  const fz = cfg.fontSize ?? 13;
  const active = isChildActive(item) || (item.children ?? []).some(isChildActive);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        className={cn(
          "flex items-center gap-1 transition-colors",
          fontWeightClass(cfg.fontWeight),
          cfg.uppercase && "uppercase tracking-wide",
        )}
        style={{
          paddingLeft: px,
          paddingRight: px,
          paddingTop: py,
          paddingBottom: py,
          fontSize: fz,
          letterSpacing: cfg.letterSpacing ? `${cfg.letterSpacing}em` : undefined,
          ...shadowForStyle(cfg.itemStyle, active, cfg),
          position: "relative",
        }}
        onClick={() => setOpen((v) => !v)}
      >
        {cfg.showIcons && item.icon && (
          <NavIcon name={item.icon} size={cfg.iconSize ?? 14} />
        )}
        {item.label}
        <ChevronDown
          style={{ width: 12, height: 12, marginLeft: 2 }}
          className={cn("transition-transform", open && "rotate-180")}
        />
        {/* underline indicator */}
        {cfg.itemStyle === "underline" && active && (
          <span
            className="absolute inset-x-0 bottom-0 h-0.5"
            style={{ backgroundColor: cfg.activeTextColor ?? cfg.activeBgColor ?? "currentColor" }}
          />
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-border/50 bg-card/95 p-1 shadow-lg backdrop-blur-sm"
          style={{ borderColor: cfg.outerBorderColor }}
        >
          {(item.children ?? []).map((child) => (
            <DropdownChild
              key={child.id}
              item={child}
              cfg={cfg}
              isActive={isChildActive(child)}
              onNavigate={(i) => {
                onNavigate(i);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DropdownChild({
  item,
  cfg,
  isActive,
  onNavigate,
}: {
  item: NavBarItem;
  cfg: NavBarConfig;
  isActive: boolean;
  onNavigate: (i: NavBarItem) => void;
}) {
  const fz = cfg.fontSize ?? 13;
  const iconSize = cfg.iconSize ?? 14;

  if (item.type === "divider") {
    return <div className="my-1 h-px" style={{ backgroundColor: cfg.dividerColor ?? "var(--border)" }} />;
  }
  if (item.type === "label") {
    return (
      <div
        className="px-2 py-1 text-xs font-semibold text-muted-foreground"
        style={{ fontSize: fz - 1 }}
      >
        {item.label}
      </div>
    );
  }

  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent hover:text-accent-foreground",
        isActive && "font-medium",
      )}
      style={{
        fontSize: fz,
        color: isActive ? cfg.activeTextColor : cfg.textColor,
        backgroundColor: isActive ? cfg.activeBgColor : undefined,
      }}
      onClick={() => onNavigate(item)}
    >
      {cfg.showIcons && item.icon && <NavIcon name={item.icon} size={iconSize} />}
      {item.label}
    </button>
  );
}

// ─── Horizontal nav bar ─────────────────────────────────────────────────────

function HorizontalNav({
  cfg,
  onNavigate,
  isItemActive,
}: {
  cfg: NavBarConfig;
  onNavigate: (item: NavBarItem) => void;
  isItemActive: (item: NavBarItem) => boolean;
}) {
  const px = cfg.itemPaddingX ?? 12;
  const py = cfg.itemPaddingY ?? 6;
  const fz = cfg.fontSize ?? 13;
  const gap = cfg.gap ?? 2;

  function itemStyle(item: NavBarItem): React.CSSProperties {
    const active = isItemActive(item);
    return {
      paddingLeft: px,
      paddingRight: px,
      paddingTop: py,
      paddingBottom: py,
      fontSize: fz,
      letterSpacing: cfg.letterSpacing ? `${cfg.letterSpacing}em` : undefined,
      ...shadowForStyle(cfg.itemStyle, active, cfg),
      position: "relative",
    };
  }

  const justifyMap: Record<NonNullable<NavBarConfig["alignment"]>, string> = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    "space-between": "justify-between",
  };

  return (
    <div
      className={cn(
        "flex h-full w-full items-center",
        justifyMap[cfg.alignment ?? "left"],
      )}
      style={{ gap }}
    >
      {/* Brand */}
      {(cfg.brandLabel || cfg.brandLogoUrl) && (
        <>
          <div className="flex items-center gap-2 shrink-0">
            {cfg.brandLogoUrl && (
              <img
                src={cfg.brandLogoUrl}
                alt={cfg.brandLabel ?? "Logo"}
                style={{ height: cfg.brandLogoSize ?? 24, width: "auto" }}
                className="object-contain"
              />
            )}
            {cfg.brandLabel && (
              <span
                className={cn("font-semibold", fontWeightClass(cfg.fontWeight))}
                style={{ fontSize: fz, color: cfg.textColor }}
              >
                {cfg.brandLabel}
              </span>
            )}
          </div>
          {cfg.showDividers && (
            <div className="h-5 w-px mx-1" style={{ backgroundColor: cfg.dividerColor ?? "var(--border)" }} />
          )}
        </>
      )}

      {/* Nav items */}
      {cfg.items.map((item, idx) => {
        if (item.type === "divider") {
          return (
            <div
              key={item.id}
              className="h-5 w-px mx-1"
              style={{ backgroundColor: cfg.dividerColor ?? "var(--border)" }}
            />
          );
        }
        if (item.type === "label") {
          return (
            <span
              key={item.id}
              className="px-2 text-xs font-semibold text-muted-foreground"
              style={{ fontSize: fz - 2, color: cfg.textColor }}
            >
              {item.label}
            </span>
          );
        }

        const hasChildren = (item.children ?? []).length > 0;

        if (hasChildren) {
          return (
            <HorizontalDropdown
              key={item.id}
              item={item}
              cfg={cfg}
              isChildActive={isItemActive}
              onNavigate={onNavigate}
            />
          );
        }

        const active = isItemActive(item);
        return (
          <div key={item.id} className="flex items-center">
            {idx > 0 && cfg.showDividers && (
              <div className="h-5 w-px mr-1" style={{ backgroundColor: cfg.dividerColor ?? "var(--border)" }} />
            )}
            <button
              className={cn(
                "flex items-center gap-1.5 transition-colors",
                fontWeightClass(cfg.fontWeight),
                cfg.uppercase && "uppercase tracking-wide",
              )}
              style={itemStyle(item)}
              onClick={() => onNavigate(item)}
            >
              {cfg.showIcons && item.icon && (
                <NavIcon name={item.icon} size={cfg.iconSize ?? 14} />
              )}
              {item.label}
              {/* underline active indicator */}
              {cfg.itemStyle === "underline" && active && (
                <span
                  className="absolute inset-x-0 bottom-0 h-0.5"
                  style={{
                    backgroundColor:
                      cfg.activeTextColor ?? cfg.activeBgColor ?? "currentColor",
                  }}
                />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Vertical nav bar ───────────────────────────────────────────────────────

function VerticalNavItem({
  item,
  cfg,
  depth,
  isItemActive,
  onNavigate,
}: {
  item: NavBarItem;
  cfg: NavBarConfig;
  depth: number;
  isItemActive: (item: NavBarItem) => boolean;
  onNavigate: (item: NavBarItem) => void;
}) {
  const hasChildren = (item.children ?? []).length > 0;
  const [collapsed, setCollapsed] = useState(cfg.sectionDefaultCollapsed ?? false);
  const px = cfg.itemPaddingX ?? 12;
  const py = cfg.itemPaddingY ?? 6;
  const fz = cfg.fontSize ?? 13;
  const indent = cfg.childIndent ?? 16;
  const active = isItemActive(item);
  const anyChildActive = hasChildren && (item.children ?? []).some(isItemActive);

  if (item.type === "divider") {
    return (
      <div
        className="my-1 h-px"
        style={{
          marginLeft: depth * indent,
          backgroundColor: cfg.dividerColor ?? "var(--border)",
        }}
      />
    );
  }
  if (item.type === "label") {
    return (
      <div
        className="px-2 py-1 text-xs font-semibold text-muted-foreground"
        style={{ paddingLeft: depth * indent + px, fontSize: fz - 2, color: cfg.textColor }}
      >
        {item.label.toUpperCase()}
      </div>
    );
  }

  return (
    <div>
      <button
        className={cn(
          "flex w-full items-center gap-2 transition-colors",
          fontWeightClass(cfg.fontWeight),
          cfg.uppercase && "uppercase tracking-wide",
          !hasChildren && "hover:opacity-80",
          (active || anyChildActive) && "font-medium",
        )}
        style={{
          paddingLeft: depth * indent + px,
          paddingRight: px,
          paddingTop: py,
          paddingBottom: py,
          fontSize: fz,
          letterSpacing: cfg.letterSpacing ? `${cfg.letterSpacing}em` : undefined,
          ...shadowForStyle(cfg.itemStyle, active, cfg),
        }}
        onClick={() => {
          if (hasChildren && cfg.sectionCollapsible) {
            setCollapsed((v) => !v);
          } else {
            onNavigate(item);
          }
        }}
      >
        {cfg.showIcons && item.icon && (
          <NavIcon name={item.icon} size={cfg.iconSize ?? 14} />
        )}
        <span className="flex-1 text-left">{item.label}</span>
        {hasChildren && cfg.sectionCollapsible && (
          <ChevronRight
            style={{ width: 12, height: 12 }}
            className={cn("transition-transform shrink-0", !collapsed && "rotate-90")}
          />
        )}
        {hasChildren && !cfg.sectionCollapsible && (
          <ChevronDown style={{ width: 12, height: 12 }} className="shrink-0" />
        )}
      </button>

      {hasChildren && !collapsed && (
        <div>
          {cfg.showDividers && (
            <div
              className="mb-0.5 h-px"
              style={{
                marginLeft: (depth + 1) * indent,
                backgroundColor: cfg.dividerColor ?? "var(--border)",
              }}
            />
          )}
          {(item.children ?? []).map((child) => (
            <VerticalNavItem
              key={child.id}
              item={child}
              cfg={cfg}
              depth={depth + 1}
              isItemActive={isItemActive}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VerticalNav({
  cfg,
  onNavigate,
  isItemActive,
}: {
  cfg: NavBarConfig;
  onNavigate: (item: NavBarItem) => void;
  isItemActive: (item: NavBarItem) => boolean;
}) {
  const fz = cfg.fontSize ?? 13;
  const px = cfg.itemPaddingX ?? 12;

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto" style={{ gap: cfg.gap ?? 2 }}>
      {/* Brand */}
      {(cfg.brandLabel || cfg.brandLogoUrl) && (
        <div className="flex items-center gap-2 px-3 py-3 shrink-0">
          {cfg.brandLogoUrl && (
            <img
              src={cfg.brandLogoUrl}
              alt={cfg.brandLabel ?? "Logo"}
              style={{ height: cfg.brandLogoSize ?? 24, width: "auto" }}
              className="object-contain"
            />
          )}
          {cfg.brandLabel && (
            <span
              className="font-semibold"
              style={{ fontSize: fz, color: cfg.textColor }}
            >
              {cfg.brandLabel}
            </span>
          )}
        </div>
      )}

      {cfg.showDividers && (cfg.brandLabel || cfg.brandLogoUrl) && (
        <div className="h-px" style={{ marginLeft: px, backgroundColor: cfg.dividerColor ?? "var(--border)" }} />
      )}

      {/* Items */}
      <div className="flex flex-col flex-1">
        {cfg.items.map((item) => (
          <VerticalNavItem
            key={item.id}
            item={item}
            cfg={cfg}
            depth={0}
            isItemActive={isItemActive}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

interface NavBarPanelProps {
  config: NavBarConfig;
  dashboardId: string;
}

export function NavBarPanel({ config: cfg, dashboardId }: NavBarPanelProps) {
  const activeTabs = useInteractionStore((s) => s.activeTabs);
  const setActiveTab = useInteractionStore((s) => s.setActiveTab);
  const dashboard = useDashboardStore((s) => s.dashboards[dashboardId]);

  const tabs = dashboard?.tabs ?? [];
  const activeTabId = activeTabs[dashboardId] ?? tabs[0]?.id ?? null;

  function isItemActive(item: NavBarItem): boolean {
    if (item.type !== "tab") return false;
    return item.tabId === activeTabId;
  }

  function handleNavigate(item: NavBarItem) {
    if (item.type === "tab" && item.tabId) {
      setActiveTab(dashboardId, item.tabId);
    } else if (item.type === "url" && item.url) {
      if (item.openInNew) {
        window.open(item.url, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = item.url;
      }
    }
  }

  const containerStyle: React.CSSProperties = {
    background: cfg.background,
    border: cfg.showOuterBorder
      ? `1px solid ${cfg.outerBorderColor ?? "var(--border)"}`
      : undefined,
    borderRadius: cfg.showOuterBorder ? 8 : undefined,
    width: "100%",
    height: "100%",
    overflow: "hidden",
  };

  if (cfg.items.length === 0) {
    return (
      <div
        className="flex h-full w-full items-center justify-center text-xs text-muted-foreground"
        style={containerStyle}
      >
        No nav items — configure in the Viz tab
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {cfg.orientation === "vertical" ? (
        <VerticalNav
          cfg={cfg}
          onNavigate={handleNavigate}
          isItemActive={isItemActive}
        />
      ) : (
        <HorizontalNav
          cfg={cfg}
          onNavigate={handleNavigate}
          isItemActive={isItemActive}
        />
      )}
    </div>
  );
}
