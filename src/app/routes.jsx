import HomePage from "../pages/HomePage";
import CallPage from "../pages/CallPage";
import PreCallPage from "../pages/PreCallPage";
import NotFoundPage from "../pages/NotFoundPage";

import CallLayout from "./layouts/CallLayout";
import CallRouteGuard from "../features/call/components/CallRouteGuard";

const routes = [
  {
    path: "/",
    element: <HomePage />,
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
