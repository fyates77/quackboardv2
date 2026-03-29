import { Skeleton } from "@/components/ui/skeleton";

export function LoadingScreen() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Quackboard</h1>
      <p className="text-sm text-muted-foreground">
        Initializing DuckDB engine...
      </p>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-2 w-48" />
        <Skeleton className="h-2 w-36" />
      </div>
    </div>
  );
}
