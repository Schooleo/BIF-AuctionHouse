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
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminProductDetailsPage from "./pages/admin/AdminProductDetailsPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminCategoryDetailsPage from "./pages/admin/AdminCategoryDetailsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminUserDetailsPage from "./pages/admin/AdminUserDetailsPage";
import AdminUpgradeRequestsPage from "./pages/admin/UpgradeRequestsPage";
import AdminProfilePage from "./pages/admin/AdminProfilePage";
import { useEffect } from "react";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import UnauthorizedPage from "./pages/shared/UnauthorizedPage";
import ForbiddenPage from "./pages/shared/ForbiddenPage";
import AlertContainer from "@containers/ui/AlertContainer";
import WatchListPage from "@pages/user/WatchlistPage";
import BiddingPage from "@pages/user/biddingPage";
import SellerProductDetailsPage from "@pages/seller/SellerProductDetailsPage";
import OrderCompletionPage from "@pages/order/OrderCompletionPage";
import { SocketProvider } from "./contexts/SocketContext";

const RoleBasedRedirect = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user?.role === "seller" && location.pathname === "/") {
      navigate("/seller/products");
    }
    if (
      user?.role === "admin" &&
      (location.pathname === "/" || location.pathname === "/admin/")
    ) {
      if (location.pathname === "/") navigate("/admin");
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
      <SocketProvider>
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
                  <Route path="products/:id" element={<ProductDetailsPage />} />
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
                  <Route
                    path="reset-password"
                    element={<ResetPasswordPage />}
                  />
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
                    <Route
                      path="bid-winners"
                      element={<SellerProductsPage />}
                    />
                    <Route path="add-product" element={<AddProductPage />} />
                    <Route
                      path="orders/:id"
                      element={<OrderCompletionPage />}
                    />
                    <Route path="profile" element={<SellerProfilePage />} />
                  </Route>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                  <Route path="admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="products" element={<AdminProductsPage />} />
                    <Route
                      path="products/:id"
                      element={<AdminProductDetailsPage />}
                    />
                    <Route
                      path="categories"
                      element={<AdminCategoriesPage />}
                    />
                    <Route
                      path="categories/:id"
                      element={<AdminCategoryDetailsPage />}
                    />
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route
                      path="users/:id"
                      element={<AdminUserDetailsPage />}
                    />
                    <Route
                      path="upgrade-requests"
                      element={<AdminUpgradeRequestsPage />}
                    />
                    <Route path="profile" element={<AdminProfilePage />} />
                  </Route>
                </Route>

                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="/forbidden" element={<ForbiddenPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route
                      path="orders/:id"
                      element={
                        <RoleBasedRedirect>
                          <OrderCompletionPage />
                        </RoleBasedRedirect>
                      }
                    />
                  </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </>
            )
          )}
        />
        <AlertContainer />
      </SocketProvider>
    </>
  );
};

export default App;
