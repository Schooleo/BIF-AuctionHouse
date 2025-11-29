import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@components/ui/Navbar";
import Footer from "@components/ui/Footer";
import SellerSideBar from "@components/seller/SellerSideBar";

const SellerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex flex-1 w-full">
        <div className="hidden md:block w-64 shrink-0">
          <SellerSideBar />
        </div>

        <main className="flex-1 min-w-0 p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default SellerLayout;
