import { Routes, Route, Outlet, Navigate, useNavigate } from "react-router-dom";

import { CallProvider } from "./features/call/providers/CallProvider";
import CallRouteGuard from "./features/call/components/CallRouteGuard";

import PreCallPage from "./pages/PreCallPage";
import CallPage from "./pages/CallPage";
import NotFoundPage from "./pages/NotFoundPage";
import HomePage from "./pages/HomePage";

// Home Page
<HomePage />;

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
