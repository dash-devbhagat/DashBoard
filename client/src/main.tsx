import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Route, Router } from "wouter";

// Use hash-based routing
const useHashLocation = () => {
  const [loc, setLoc] = useState(window.location.hash.slice(1) || "/");

  useEffect(() => {
    const handler = () => setLoc(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
  }, []);

  return [loc, navigate] as const;
};

// Import useState, useEffect, and useCallback from React
import { useState, useEffect, useCallback } from "react";

createRoot(document.getElementById("root")!).render(
  <Router hook={useHashLocation}>
    <App />
  </Router>
);
