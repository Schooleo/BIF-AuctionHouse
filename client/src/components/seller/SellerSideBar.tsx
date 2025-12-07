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
        {menuItems.map((item) => {
          const isProductDetails =
            item.path === "/seller/products" &&
            location.pathname.startsWith("/seller/products/") &&
            location.pathname !== "/seller/products";

          const isOrderDetails =
            item.path === "/seller/bid-winners" &&
            location.pathname.startsWith("/seller/orders/");

          const isActive =
            location.pathname === item.path ||
            isProductDetails ||
            isOrderDetails;

          return (
            <React.Fragment key={item.path}>
              <Link
                to={item.path}
                className={classNames(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200",
                  {
                    "bg-primary-blue text-white shadow-md": isActive,
                    "text-gray-700 hover:bg-gray-100 hover:text-gray-900":
                      !isActive,
                  }
                )}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
              {(isProductDetails || isOrderDetails) && (
                <div className="ml-5 mt-2 space-y-1 border-l-2 border-gray-200 pl-3">
                  <span className="block py-2 text-sm transition-colors duration-200 text-primary-blue font-semibold">
                    {isProductDetails ? "Product Details" : "Order Completion"}
                  </span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </nav>
      <div className="mt-8 pt-8 border-t border-gray-200">
        <Link
          to="/seller/profile"
          className={classNames(
            "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200",
            {
              "bg-primary-blue text-white shadow-md":
                location.pathname === "/seller/profile",
              "text-gray-700 hover:bg-gray-50 hover:text-gray-900":
                location.pathname !== "/seller/profile",
            }
          )}
        >
          <span className="mr-3">
            <Settings className="w-5 h-5" />
          </span>
          Profile
        </Link>

        {/* Sub-menu for Profile */}
        {location.pathname === "/seller/profile" && (
          <div className="ml-5 mt-2 space-y-1 border-l-2 border-gray-200 pl-3">
            <Link
              to="/seller/profile?tab=overview"
              className={classNames(
                "block py-2 text-sm transition-colors duration-200",
                {
                  "text-primary-blue font-semibold":
                    new URLSearchParams(location.search).get("tab") ===
                      "overview" ||
                    !new URLSearchParams(location.search).get("tab"),
                  "text-gray-500 hover:text-gray-700":
                    new URLSearchParams(location.search).get("tab") !==
                      "overview" &&
                    !!new URLSearchParams(location.search).get("tab"),
                }
              )}
            >
              Overview
            </Link>
            <Link
              to="/seller/profile?tab=info"
              className={classNames(
                "block py-2 text-sm transition-colors duration-200",
                {
                  "text-primary-blue font-semibold":
                    new URLSearchParams(location.search).get("tab") === "info",
                  "text-gray-500 hover:text-gray-700":
                    new URLSearchParams(location.search).get("tab") !== "info",
                }
              )}
            >
              Personal Info
            </Link>
            <Link
              to="/seller/profile?tab=ratings"
              className={classNames(
                "block py-2 text-sm transition-colors duration-200",
                {
                  "text-primary-blue font-semibold":
                    new URLSearchParams(location.search).get("tab") ===
                    "ratings",
                  "text-gray-500 hover:text-gray-700":
                    new URLSearchParams(location.search).get("tab") !==
                    "ratings",
                }
              )}
            >
              Ratings Received
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerSideBar;
