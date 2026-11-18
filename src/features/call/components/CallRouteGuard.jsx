import { Navigate, Outlet } from "react-router-dom";

import { useCall } from "../providers/CallProvider";

const CallRouteGuard = () => {
  const { isCallEntryAllowed } = useCall();

  if (!isCallEntryAllowed) {
    return (
      <Navigate
        to="/pre-call"
        replace
      />
    );
  }

  return <Outlet />;
};

export default CallRouteGuard;
