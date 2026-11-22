import HomePage from "../pages/HomePage";
import CallPage from "../pages/CallPage";
import PreCallPage from "../pages/PreCallPage";
import WebRTCLabPage from "../pages/WebRTCLabPage";
import NotFoundPage from "../pages/NotFoundPage";

import CallLayout from "./layouts/CallLayout";
import CallRouteGuard from "../features/call/components/CallRouteGuard";

const routes = [
  {
    path: "/",
    element: <HomePage />,
  },

  {
    path: "/webrtc-lab",
    element: <WebRTCLabPage />,
  },

  {
    element: <CallLayout />,
    children: [
      {
        path: "pre-call",
        element: <PreCallPage />,
      },

      {
        element: <CallRouteGuard />,
        children: [
          {
            path: "call",
            element: <CallPage />,
          },
        ],
      },
    ],
  },

  {
    path: "*",
    element: <NotFoundPage />,
  },
];

export default routes;
