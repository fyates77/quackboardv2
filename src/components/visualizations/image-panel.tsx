interface ImagePanelProps {
  url: string;
  alt?: string;
  objectFit?: "cover" | "contain" | "fill";
}

export function ImagePanel({ url, alt = "", objectFit = "contain" }: ImagePanelProps) {
  if (!url.trim()) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        No image URL configured
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden">
      <img
        src={url}
        alt={alt}
        className="h-full w-full"
        style={{ objectFit }}
      />
    </div>
  );
}
