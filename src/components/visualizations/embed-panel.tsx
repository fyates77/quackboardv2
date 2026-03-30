interface EmbedPanelProps {
  url: string;
}

export function EmbedPanel({ url }: EmbedPanelProps) {
  if (!url.trim()) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        No embed URL configured
      </div>
    );
  }

  return (
    <iframe
      src={url}
      className="h-full w-full border-none"
      sandbox="allow-scripts allow-same-origin allow-forms"
      title="Embedded content"
    />
  );
}
