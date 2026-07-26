import { Navigate, createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import {
  authOnlyMiddleware,
  authPagesMiddleware,
} from "./auth/clientMiddlewares";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
    middleware: [authPagesMiddleware],
  },
  {
    path: "/register",
    element: <RegisterPage />,
    middleware: [authPagesMiddleware],
  },
  {
    path: "/home",
    element: <HomePage />,
    middleware: [authOnlyMiddleware],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
