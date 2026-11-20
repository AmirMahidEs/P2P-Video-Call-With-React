import { RouterProvider } from "react-router-dom";

import router from "./app/index";

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
