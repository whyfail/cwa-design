import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { App } from "./app";
export { routes } from "./routes";
export function render(route: string): string {
  return renderToString(
    <StrictMode>
      <App route={route} />
    </StrictMode>,
  );
}
