import { Link } from "react-router-dom";
import logo from "../../assets/img/BIF.jpg";

const Navbar = () => {
  return (
    <header className="flex items-center justify-between bg-blue-900 shadow-md">
      <Link to="/" className="flex flex-row font-bold text-xl text-gray-800">
        <img src={logo} className="h-20 w-20" alt="Logo" />
      </Link>
      <nav className="p-7">
        <ul className="flex space-x-10">
          <li>
            <Link to="/" className="text-white">
              Home
            </Link>
          </li>
          <li>
            <Link to="/auctions" className="text-white">
              Auctions
            </Link>
          </li>
          <li>
            <Link to="/create-auction" className="text-white">
              Create Auction
            </Link>
          </li>
          <li>
            <Link to="/profile" className="text-white">
              Profile
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
