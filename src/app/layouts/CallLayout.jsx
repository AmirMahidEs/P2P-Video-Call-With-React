import { Outlet } from "react-router-dom";

import { CallProvider } from "../../features/call/providers/CallProvider";

const CallLayout = () => {
  return (
    <CallProvider>
      <Outlet />
    </CallProvider>
  );
};

export default CallLayout;
