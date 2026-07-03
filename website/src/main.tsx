import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createApplication } from "./app/bootstrap";
import "./styles/tokens.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element is missing");
}

const root = createRoot(rootElement);

void createApplication().then((application) => {
  root.render(<StrictMode>{application}</StrictMode>);
});
