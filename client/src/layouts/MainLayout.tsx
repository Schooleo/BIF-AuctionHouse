import { Outlet } from "react-router-dom";
import Navbar from "../components/ui/Navbar";

const MainLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

export default MainLayout;
