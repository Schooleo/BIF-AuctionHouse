import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tag,
  Users,
  FileText,
  User,
  ShieldCheck,
  ShoppingCart,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import classNames from "classnames";

const AdminSideBar: React.FC = () => {
  const location = useLocation();
  const [isProductsExpanded, setIsProductsExpanded] = useState(
    location.pathname.includes("/admin/products")
  );

  const menuItems = [
    {
      label: "Admin Dashboard",
      path: "/admin",
      icon: <LayoutDashboard className="w-5 h-5" />,
      exact: true,
    },
    {
      label: "Products",
      path: "/admin/products",
      icon: <Package className="w-5 h-5" />,
      hasSubmenu: true,
      submenu: [
        {
          label: "Active Products",
          path: "/admin/products/active",
        },
        {
          label: "Ended Products",
          path: "/admin/products/ended",
        },
        {
          label: "Add Product",
          path: "/admin/products/add",
        },
      ],
    },
    {
      label: "Categories",
      path: "/admin/categories",
      icon: <Tag className="w-5 h-5" />,
    },
    {
      label: "Users",
      path: "/admin/users",
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Orders",
      path: "/admin/orders",
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      label: "Requests",
      path: "/admin/upgrade-requests",
      icon: <FileText className="w-5 h-5" />,
    },
  ];

  const handleProductsToggle = () => {
    setIsProductsExpanded(!isProductsExpanded);
  };

  return (
    <div className="w-full bg-white border-r border-gray-200 py-4 pl-6 pr-8 h-full">
      <div className="mt-6 mb-8 flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-primary-blue shrink-0" />
        <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">
          Admin Portal
        </h2>
      </div>
      <nav className="space-y-1">
        {menuItems.map((item) => {
          // Logic for sub-details
          const isProductsDetails =
            item.path === "/admin/products" &&
            location.pathname.startsWith("/admin/products/") &&
            location.pathname !== "/admin/products";
          const isCategoriesDetails =
            item.path === "/admin/categories" &&
            location.pathname.startsWith("/admin/categories/") &&
            location.pathname !== "/admin/categories";
          const isOrdersDetails =
            item.path === "/admin/orders" &&
            location.pathname.startsWith("/admin/orders/") &&
            location.pathname !== "/admin/orders";
          const isUsersDetails =
            item.path === "/admin/users" &&
            location.pathname.startsWith("/admin/users/") &&
            location.pathname !== "/admin/users";

          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);

          return (
            <React.Fragment key={item.path}>
              {item.hasSubmenu ? (
                <div>
                  <button
                    onClick={handleProductsToggle}
                    className={classNames(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-left",
                      {
                        "bg-primary-blue text-white shadow-md": isActive,
                        "text-gray-700 hover:bg-gray-100": !isActive,
                      }
                    )}
                  >
                    {item.icon}
                    <span className="font-medium flex-1">{item.label}</span>
                    {isProductsExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {isProductsExpanded && item.submenu && (
                    <div className="ml-5 mt-2 space-y-1 border-l-2 border-gray-200 pl-3">
                      {item.submenu.map((subItem) => {
                        const isSubActive = location.pathname === subItem.path;
                        return (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={classNames(
                              "block py-2 text-sm transition-colors duration-200 rounded-md px-3",
                              {
                                "text-primary-blue font-semibold bg-blue-50":
                                  isSubActive,
                                "text-gray-600 hover:text-primary-blue hover:bg-gray-50":
                                  !isSubActive,
                              }
                            )}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
              )}
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={classNames(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    {
                      "bg-primary-blue text-white shadow-md":
                        item.exact
                          ? location.pathname === item.path
                          : isActive,
                      "text-gray-700 hover:bg-gray-100": !(item.exact
                        ? location.pathname === item.path
                        : isActive),
                    }
                  )}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              )}
              {isCategoriesDetails && (
                <div className="ml-5 mt-2 space-y-1 border-l-2 border-gray-200 pl-3">
                  <span className="block py-2 text-sm transition-colors duration-200 text-primary-blue font-semibold">
                    Category Details
                  </span>
                </div>
              )}
              {isOrdersDetails && (
                <div className="ml-5 mt-2 space-y-1 border-l-2 border-gray-200 pl-3">
                  <span className="block py-2 text-sm transition-colors duration-200 text-primary-blue font-semibold">
                    Order Details
                  </span>
                </div>
              )}
              {isUsersDetails && (
                <div className="ml-5 mt-2 space-y-1 border-l-2 border-gray-200 pl-3">
                  <span className="block py-2 text-sm transition-colors duration-200 text-primary-blue font-semibold">
                    User Details
                  </span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Settings and Profile at Bottom */}
      <div className="mt-8 pt-4 border-t border-gray-200 space-y-1">
        <Link
          to="/admin/config"
          className={classNames(
            "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200",
            {
              "bg-primary-blue text-white shadow-md":
                location.pathname === "/admin/config",
              "text-gray-700 hover:bg-gray-50 hover:text-gray-900":
                location.pathname !== "/admin/config",
            }
          )}
        >
          <span className="mr-3">
            <Settings className="w-5 h-5" />
          </span>
          System Config
        </Link>
        <Link
          to="/admin/profile"
          className={classNames(
            "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200",
            {
              "bg-primary-blue text-white shadow-md":
                location.pathname === "/admin/profile",
              "text-gray-700 hover:bg-gray-50 hover:text-gray-900":
                location.pathname !== "/admin/profile",
            }
          )}
        >
          <span className="mr-3">
            <User className="w-5 h-5" />
          </span>
          Profile
        </Link>
      </div>
    </div>
  );
};

export default AdminSideBar;
