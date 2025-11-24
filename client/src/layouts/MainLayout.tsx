// client/src/layouts/MainLayout.tsx - REVISED
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "@components/ui/Navbar";
import Footer from "@components/ui/Footer";
import SideBarCategory from "@components/ui/LeftSideBar";

const mockCategories = [
  { _id: "cat1", name: "Electronics" },
  { _id: "cat2", name: "Fashion" },
  { _id: "cat3", name: "Home & Garden" },
  { _id: "cat4", name: "Sports" },
  { _id: "cat5", name: "Toys" },
];

const MainLayout: React.FC = () => {
  const location = useLocation();
  const hideSidebar = location.pathname.startsWith("/product/");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex flex-1 w-full px-4 md:px-8">
        {!hideSidebar && (
          <div className="hidden md:block w-64 mt-8 mr-8 shrink-0">
            <SideBarCategory categories={mockCategories} />
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
