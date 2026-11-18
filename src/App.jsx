import { Routes, Route, Outlet, Navigate, useNavigate } from "react-router-dom";

import { CallProvider } from "./features/call/providers/CallProvider";
import CallRouteGuard from "./features/call/components/CallRouteGuard";

import PreCallPage from "./pages/PreCallPage";
import CallPage from "./pages/CallPage";

// Home Page
const HomePage = () => {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 p-6 text-white">
      <h1 className="text-4xl font-bold">P2P Video Call</h1>

      <p className="text-slate-400">
        Welcome to your video calling application.
      </p>

      <button
        onClick={() => navigate("/pre-call")}
        className="rounded-xl bg-blue-600 px-8 py-3 font-semibold transition hover:bg-blue-700"
      >
        Start a Call
      </button>
    </main>
  );
};

// Not Found Page
const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-950 text-white">
      <h1 className="text-6xl font-bold">404</h1>

      <p className="text-slate-400">Page Not Found</p>

      <button
        onClick={() => navigate("/")}
        className="rounded-lg bg-blue-600 px-6 py-3"
      >
        Back to Home
      </button>
    </main>
  );
};

// Shared Call Layout
const CallLayout = () => {
  return (
    <CallProvider>
      <Outlet />
    </CallProvider>
  );
};

// Application Routes
const App = () => {
  return (
    <Routes>
      {/* Home */}
      <Route
        path="/"
        element={<HomePage />}
      />

      {/* Call Routes */}
      <Route element={<CallLayout />}>
        <Route
          path="/pre-call"
          element={<PreCallPage />}
        />

        {/* Protected Call Route */}
        <Route element={<CallRouteGuard />}>
          <Route
            path="/call"
            element={<CallPage />}
          />
        </Route>
      </Route>

      {/* Unknown Routes */}
      <Route
        path="*"
        element={<NotFoundPage />}
      />
    </Routes>
  );
};

export default App;
