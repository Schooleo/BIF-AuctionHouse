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
import AuthLayout from "./layouts/AuthLayout";
import SellerLayout from "./layouts/SellerLayout";
import AdminLayout from "./layouts/AdminLayout";

import { useEffect } from "react";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AlertContainer from "./containers/ui/AlertContainer";
import { SocketProvider } from "./contexts/SocketContext";

import {
  HomePage,
  ProductsPage,
  ProductDetailsPage,
  ProfilePage,
  WatchlistPage as WatchListPage,
  BiddingPage,
} from "./pages/user";

import {
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  LogoutPage,
} from "./pages/auth";

import { NotFoundPage, UnauthorizedPage, ForbiddenPage } from "./pages/shared";

import {
  SellerProductsPage,
  AddProductPage,
  SellerProfilePage,
  SellerProductDetailsPage,
} from "./pages/seller";

import {
  AdminDashboardPage,
  AdminActiveProductsPage,
  AdminEndedProductsPage,
  AdminAddProductPage,
  AdminProductDetailsPage,
  AdminCategoriesPage,
  AdminCategoryDetailsPage,
  AdminUsersPage,
  AdminUserDetailsPage,
  AdminOrdersPage,
  AdminOrderDetailsPage,
  AdminUpgradeRequestsPage,
  AdminProfilePage,
} from "./pages/admin";

import AdminSystemConfigPage from "./pages/admin/AdminSystemConfigPage";

import { OrderCompletionPage } from "./pages/order";

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
                    <Route path="products/active" element={<AdminActiveProductsPage />} />
                    <Route path="products/ended" element={<AdminEndedProductsPage />} />
                    <Route path="products/add" element={<AdminAddProductPage />} />
                    <Route
                      path="products/:id"
                      element={<AdminProductDetailsPage />}
                    />
                    <Route path="orders" element={<AdminOrdersPage />} />
                    <Route
                      path="orders/:id"
                      element={<AdminOrderDetailsPage />}
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
                    <Route path="config" element={<AdminSystemConfigPage />} />
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
