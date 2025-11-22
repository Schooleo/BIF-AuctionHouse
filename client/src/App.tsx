import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import { useAuthStore } from "./stores/useAuthStore";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/user/HomePage";
import NotFoundPage from "./pages/shared/NotFoundPage";
import AuthLayout from "./layouts/AuthLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import { useEffect } from "react";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
      </Route>
    </>
  )
);

const App = () => {
  const refreshUser = useAuthStore((state) => state.refreshUser);

  useEffect(() => {
    // Guard against undefined
    if (refreshUser) {
      refreshUser();
    }
  }, [refreshUser]);

  return <RouterProvider router={router} />;
};

export default App;
