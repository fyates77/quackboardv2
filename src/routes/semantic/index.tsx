import { createFileRoute } from "@tanstack/react-router";
import { SemanticPage } from "@/components/semantic/semantic-page";

export const Route = createFileRoute("/semantic/")({
  component: SemanticPage,
});
