// client/src/layouts/MainLayout.tsx - REVISED
import React from "react";
import { useState, useEffect } from "react";
import type { Category } from "@interfaces/product";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "@components/ui/Navbar";
import Footer from "@components/ui/Footer";
import SideBarCategory from "@components/ui/LeftSideBar";
import { productApi } from "@services/product.api";


const MainLayout: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const location = useLocation();
  const hideSidebar = location.pathname.startsWith("/product/");

  useEffect(() => {
    productApi.fetchCategories().then(setCategories);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex flex-1 w-full px-4 md:px-8">
        {!hideSidebar && (
          <div className="hidden md:block w-64 mt-8 mr-8 shrink-0">
            <SideBarCategory categories={categories} />
          </div>
        )}

        <main
          className={`flex-1 min-w-0 ${hideSidebar ? "max-w-7xl mx-auto" : ""}`}
        >
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default MainLayout;
