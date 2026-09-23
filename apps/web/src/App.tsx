import { Navigate, createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import {
  authOnlyMiddleware,
  authPagesMiddleware,
} from "./lib/clientMiddlewares";

const authHydrateFallback = (
  <main className="grid min-h-svh place-items-center bg-canvas font-body text-sm text-content-muted">
    Loading…
  </main>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
    middleware: [authPagesMiddleware],
    hydrateFallbackElement: authHydrateFallback,
  },
  {
    path: "/register",
    element: <RegisterPage />,
    middleware: [authPagesMiddleware],
    hydrateFallbackElement: authHydrateFallback,
  },
  {
    path: "/home",
    element: <Navigate to="/home/friends" replace />,
    middleware: [authOnlyMiddleware],
    hydrateFallbackElement: authHydrateFallback,
  },
  {
    path: "/home/friends",
    element: <HomePage />,
    middleware: [authOnlyMiddleware],
    hydrateFallbackElement: authHydrateFallback,
  },
  {
    path: "/home/:friendId",
    element: <HomePage />,
    middleware: [authOnlyMiddleware],
    hydrateFallbackElement: authHydrateFallback,
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
