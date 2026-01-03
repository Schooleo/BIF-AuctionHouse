import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    // Accordion style: only one open at a time
    if (location.pathname.includes("/admin/products")) return ["Products"];
    if (
      location.pathname.includes("/admin/users") ||
      location.pathname.includes("/admin/banned-users")
    )
      return ["Users"];
    return [];
  });

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => (prev.includes(label) ? [] : [label]));
  };

  const handleParentClick = (
    e: React.MouseEvent,
    item: {
      label: string;
      path: string;
      hasSubmenu?: boolean;
      submenu?: { label: string; path: string }[];
    }
  ) => {
    e.preventDefault();

    // Accordion: Expand this one, close others
    if (!expandedMenus.includes(item.label)) {
      setExpandedMenus([item.label]);
    }

    // Determine navigation path
    let targetPath = item.path;

    // Special case for Products: default to Active
    if (item.label === "Products") {
      targetPath = "/admin/products/active";
    } else if (item.label === "Users") {
      targetPath = "/admin/users";
    }

    navigate(targetPath);
  };

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
      hasSubmenu: true,
      submenu: [
        {
          label: "Banned Users",
          path: "/admin/banned-users",
        },
      ],
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
          // Logic for sub-details (hides main menu highlight if on detail page not in submenu)
          const isProductsDetails =
            item.label === "Products" &&
            location.pathname.startsWith("/admin/products/") &&
            ![
              "/admin/products/active",
              "/admin/products/ended",
              "/admin/products/add",
            ].includes(location.pathname);

          const isCategoriesDetails =
            item.path === "/admin/categories" &&
            location.pathname.startsWith("/admin/categories/") &&
            location.pathname !== "/admin/categories";

          const isOrdersDetails =
            item.path === "/admin/orders" &&
            location.pathname.startsWith("/admin/orders/") &&
            location.pathname !== "/admin/orders";

          const isUserDetails =
            item.path === "/admin/users" &&
            location.pathname.startsWith("/admin/users/") &&
            location.pathname !== "/admin/users";

          // Active check
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path) ||
              (item.path === "/admin/users" &&
                location.pathname === "/admin/banned-users");

          const isExpanded = expandedMenus.includes(item.label);

          return (
            <React.Fragment key={item.path}>
              {item.hasSubmenu ? (
                <div>
                  <button
                    onClick={(e) => handleParentClick(e, item)}
                    className={classNames(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-left text-sm",
                      {
                        "bg-primary-blue text-white shadow-md":
                          isActive && !isProductsDetails && !isUserDetails,
                        "text-gray-700 hover:bg-gray-100": !(
                          isActive &&
                          !isProductsDetails &&
                          !isUserDetails
                        ),
                      }
                    )}
                  >
                    {item.icon}
                    <span className="font-medium flex-1">{item.label}</span>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(item.label);
                      }}
                      className="p-1 hover:bg-white/20 rounded cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                  {isExpanded && item.submenu && (
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
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200",
                    {
                      "bg-primary-blue text-white shadow-md":
                        isActive &&
                        !isProductsDetails &&
                        !isCategoriesDetails &&
                        !isOrdersDetails,
                      "text-gray-700 hover:bg-gray-100 hover:text-gray-900": !(
                        isActive &&
                        !isProductsDetails &&
                        !isCategoriesDetails &&
                        !isOrdersDetails
                      ),
                    }
                  )}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              )}

              {/* Dynamic Sub-items for Details pages */}
              {isProductsDetails && (
                <div className="ml-5 mt-2 space-y-1 border-l-2 border-gray-200 pl-3">
                  <span className="block py-2 text-sm transition-colors duration-200 text-primary-blue font-semibold">
                    Product Details
                  </span>
                </div>
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
              {isUserDetails && (
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
