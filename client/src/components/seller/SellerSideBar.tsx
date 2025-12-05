import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  List,
  Gavel,
  Settings,
  Wallet,
} from "lucide-react";
import classNames from "classnames";

const SellerSideBar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    {
      label: "Current Products",
      path: "/seller/products",
      icon: <List className="w-5 h-5" />,
    },
    {
      label: "Add A Product",
      path: "/seller/add-product",
      icon: <PlusCircle className="w-5 h-5" />,
    },
    {
      label: "Ended Products",
      path: "/seller/ended-products",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Bid Winners",
      path: "/seller/bid-winners",
      icon: <Gavel className="w-5 h-5" />,
    },
  ];

  return (
    <div className="w-full bg-white border-r border-gray-200 min-h-screen py-4 pl-6 pr-8 h-full">
      <div className="mt-6 mb-8 flex items-center gap-3">
        <Wallet className="w-6 h-6 text-primary-blue" />
        <h2 className="text-xl font-bold text-gray-800">Seller Dashboard</h2>
      </div>
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={classNames(
              "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200",
              {
                "bg-primary-blue text-white shadow-md":
                  location.pathname === item.path,
                "text-gray-700 hover:bg-gray-100 hover:text-gray-900":
                  location.pathname !== item.path,
              }
            )}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8 pt-8 border-t border-gray-200">
        <Link
          to="/seller/settings"
          className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
        >
          <span className="mr-3">
            <Settings className="w-5 h-5" />
          </span>
          Settings
        </Link>
      </div>
    </div>
  );
};

export default SellerSideBar;
