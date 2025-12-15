import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@components/ui/Navbar";
import Footer from "@components/ui/Footer";
import SellerSideBar from "@components/seller/SellerSideBar";

const SellerLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <div className="shrink-0 z-50">
        <Navbar />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative">
        {/* Main Content Area with Sticky Sidebar */}
        <div className="flex grow w-full relative">
          {/* Sidebar - Sticky within the scrollable content flow */}
          <aside className="hidden md:block w-64 shrink-0 sticky top-0 self-start h-[calc(100vh-64px)] overflow-y-auto bg-white border-r border-gray-200 z-10">
            <SellerSideBar />
          </aside>

          {/* Product/Dashboard Content */}
          <main className="flex-1 min-w-0 p-4 md:p-8">
            <Outlet />
          </main>
        </div>

        {/* Footer - Full Width at bottom of scroll */}
        <div className="shrink-0 z-20 relative">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default SellerLayout;
