import { Navigate, Outlet, createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { SocketProvider } from "./context/SocketContext";
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

function AuthenticatedAppLayout() {
  return (
    <SocketProvider>
      <Outlet />
    </SocketProvider>
  );
}

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
    element: <AuthenticatedAppLayout />,
    middleware: [authOnlyMiddleware],
    hydrateFallbackElement: authHydrateFallback,
    children: [
      {
        index: true,
        element: <Navigate to="friends" replace />,
      },
      {
        path: "friends",
        element: <HomePage />,
      },
      {
        path: ":friendId",
        element: <HomePage />,
      },
    ],
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
