import { createFileRoute } from "@tanstack/react-router";
import { PlayPondPage } from "@/components/play-pond/play-pond-page";

export const Route = createFileRoute("/play/")({
  component: PlayPondPage,
});
