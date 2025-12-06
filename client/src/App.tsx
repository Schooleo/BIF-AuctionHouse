import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuthStore } from "./stores/useAuthStore";
import MainLayout from "./layouts/MainLayout";
import UserLayout from "./layouts/UserLayout";
import HomePage from "./pages/user/HomePage";
import ProductsPage from "./pages/user/ProductsPage";
import ProductDetailsPage from "./pages/user/ProductDetailsPage";
import ProfilePage from "./pages/user/ProfilePage";
import NotFoundPage from "./pages/shared/NotFoundPage";

import AuthLayout from "./layouts/AuthLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import LogoutPage from "./pages/auth/LogoutPage";
import SellerProductsPage from "./pages/seller/SellerProductsPage";
import AddProductPage from "./pages/seller/AddProductPage";
import SellerLayout from "./layouts/SellerLayout";
import SellerProfilePage from "./pages/seller/SellerProfilePage";
import { useEffect } from "react";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import UnauthorizedPage from "./pages/shared/UnauthorizedPage";
import ForbiddenPage from "./pages/shared/ForbiddenPage";
import AlertContainer from "@containers/ui/AlertContainer";
import WatchListPage from "@pages/user/WatchlistPage";
import BiddingPage from "@pages/user/biddingPage";
import SellerProductDetailsPage from "@pages/seller/SellerProductDetailsPage";

const RoleBasedRedirect = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user?.role === "seller" && location.pathname === "/") {
      navigate("/seller/products");
    }
  }, [user, navigate, location]);

  return <>{children}</>;
};

const App = () => {
  const refreshUser = useAuthStore((state) => state.refreshUser);

  useEffect(() => {
    // Guard against undefined
    if (refreshUser) {
      refreshUser();
    }
  }, [refreshUser]);

  return (
    <>
      <RouterProvider
        router={createBrowserRouter(
          createRoutesFromElements(
            <>
              <Route
                path="/"
                element={
                  <RoleBasedRedirect>
                    <MainLayout />
                  </RoleBasedRedirect>
                }
              >
                <Route index element={<HomePage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="product/:id" element={<ProductDetailsPage />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["bidder"]} />}>
                <Route path="/" element={<UserLayout />}>
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="watchlist" element={<WatchListPage />} />
                  <Route path="bidding" element={<BiddingPage />} />
                </Route>
              </Route>

              <Route path="auth" element={<AuthLayout />}>
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="reset-password" element={<ResetPasswordPage />} />
                <Route path="logout" element={<LogoutPage />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["seller"]} />}>
                <Route path="seller" element={<SellerLayout />}>
                  <Route path="products" element={<SellerProductsPage />} />
                  <Route
                    path="products/:id"
                    element={<SellerProductDetailsPage />}
                  />
                  <Route
                    path="ended-products"
                    element={<SellerProductsPage />}
                  />
                  <Route path="add-product" element={<AddProductPage />} />
                  <Route path="profile" element={<SellerProfilePage />} />
                </Route>
              </Route>

              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/forbidden" element={<ForbiddenPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </>
          )
        )}
      />
      <AlertContainer />
    </>
  );
};

export default App;
