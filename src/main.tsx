
  import { createRoot } from "react-dom/client";
  import { HashRouter } from "react-router";
  import App from "./app/App.tsx";
  import { AuthProvider } from "./app/context/AuthContext.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  );
  