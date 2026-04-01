import { Link } from "@tanstack/react-router";
import type { SiteHeader as SiteHeaderType } from "@/types/dashboard";

interface SiteHeaderProps {
  header: SiteHeaderType;
  dashboardName: string;
  updatedAt?: string;
}

export function SiteHeader({ header, dashboardName, updatedAt }: SiteHeaderProps) {
  const title = header.title || dashboardName;

  return (
    <header
      className="flex items-center gap-4 px-6 py-3 border-b border-border/30 shrink-0"
      style={{
        background: header.background ?? "var(--color-card)",
        color: header.textColor ?? undefined,
      }}
    >
      {/* Logo */}
      {header.logoUrl && (
        <img
          src={header.logoUrl}
          alt={header.logoAlt ?? ""}
          className="h-8 w-auto object-contain shrink-0"
        />
      )}

      {/* Title + subtitle */}
      <div className="flex-1 min-w-0">
        <h1
          className="text-lg font-semibold leading-tight truncate"
          style={{ color: header.textColor ?? undefined }}
        >
          {title}
        </h1>
        {header.subtitle && (
          <p
            className="text-xs opacity-70 truncate"
            style={{ color: header.textColor ?? undefined }}
          >
            {header.subtitle}
          </p>
        )}
      </div>

      {/* Navigation links */}
      {header.links && header.links.length > 0 && (
        <nav className="flex items-center gap-4 shrink-0">
          {header.links.map((link, i) =>
            link.dashboardId ? (
              <Link
                key={i}
                to="/view/$dashboardId"
                params={{ dashboardId: link.dashboardId }}
                className="text-sm hover:underline opacity-80 hover:opacity-100 transition-opacity"
                style={{ color: header.textColor ?? undefined }}
              >
                {link.label}
              </Link>
            ) : link.url ? (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm hover:underline opacity-80 hover:opacity-100 transition-opacity"
                style={{ color: header.textColor ?? undefined }}
              >
                {link.label}
              </a>
            ) : (
              <span key={i} className="text-sm opacity-60" style={{ color: header.textColor ?? undefined }}>
                {link.label}
              </span>
            ),
          )}
        </nav>
      )}

      {/* Timestamp */}
      {header.showTimestamp && updatedAt && (
        <span
          className="text-xs opacity-50 shrink-0"
          style={{ color: header.textColor ?? undefined }}
        >
          Updated {new Date(updatedAt).toLocaleString()}
        </span>
      )}
    </header>
  );
}
