// client/src/layouts/MainLayout.tsx - REVISED
import React from "react";
import { useState, useEffect } from "react";
import type { Category } from "@interfaces/product";
import { Outlet, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@components/ui/Navbar";
import Footer from "@components/ui/Footer";
import SideBarCategory from "@components/ui/LeftSideBar";
import { productApi } from "@services/product.api";
import { useAuthStore } from "@stores/useAuthStore";

const MainLayout: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const user = useAuthStore((state) => state.user);

  const hideSidebar =
    location.pathname.startsWith("/products/") ||
    location.pathname === "/watchlist" ||
    location.pathname.startsWith("/orders/");

  // Check if user is banned when accessing product details
  useEffect(() => {
    if (user?.status === "BLOCKED" && location.pathname.startsWith("/products/")) {
      navigate("/banned", { replace: true });
    }
  }, [user, location.pathname, navigate]);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      setToken(token);
      refreshUser().then(() => {
        // After refreshing user, check if user is banned
        const user = useAuthStore.getState().user;
        if (user?.status === "BLOCKED") {
          navigate("/banned", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      });
    }
  }, [searchParams, navigate, setToken, refreshUser]);

  useEffect(() => {
    productApi.fetchCategories().then(setCategories);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar stays fixed at the top */}
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>

      {/* Main Layout Area - Global Scroll */}
      <div className="flex-1 flex w-full">
        {/* Sidebar - Fixed Left Column */}
        {!hideSidebar && (
          <div className="w-72 shrink-0 hidden md:block bg-white border-r border-gray-200">
            {/* Sticky Content: Moves inside the visual column */}
            <div className="sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto scrollbar-hide">
              <SideBarCategory categories={categories} />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className={`flex-1 min-w-0 ${!hideSidebar ? "px-8 pt-2" : "w-full max-w-7xl mx-auto px-4 py-8"}`}>
          <Outlet context={{ categories }} />
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default MainLayout;
