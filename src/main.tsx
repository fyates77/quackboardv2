import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EngineProvider } from "@/engine/engine-provider";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { App } from "./app";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <EngineProvider fallback={<LoadingScreen />}>
      <App />
    </EngineProvider>
  </StrictMode>,
);
