import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "@components/ui/Navbar";
import Footer from "@components/ui/Footer";
import { useAuthStore } from "@stores/useAuthStore";

const UserLayout = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Redirect banned users to banned page
    if (user?.status === "BLOCKED") {
      navigate("/banned", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <div className="shrink-0 z-50">
        <Navbar />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
        <div className="flex flex-1 w-full px-4 md:px-8">
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default UserLayout;
