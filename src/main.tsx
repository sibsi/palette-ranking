import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initBridge } from "./lib/bridge";
import { isDemo } from "./lib/platform";

async function bootstrap() {
  if (!isDemo) {
    await initBridge();
  }

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();
