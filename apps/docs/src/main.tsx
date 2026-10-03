import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./app";
import { routeFromPath } from "./routes";
import "@cwa-design/react/styles.css";
import "./styles/site.css";

const root = document.getElementById("root");
if (!root) throw new Error("CWA Design root is missing");
const pageData = document.getElementById("cwa-page-data");
const route = pageData
  ? (JSON.parse(pageData.textContent ?? "{}") as { route: string }).route
  : routeFromPath(location.pathname, import.meta.env.BASE_URL);
const app = (
  <StrictMode>
    <App route={route} />
  </StrictMode>
);
if (pageData) {
  hydrateRoot(root, app, {
    onRecoverableError(error) {
      console.error("CWA Design hydration error", error);
    },
  });
} else {
  createRoot(root).render(app);
}
