import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaGamepad, FaLock } from "react-icons/fa";
import { HiMagnifyingGlass } from "react-icons/hi2";

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/home");
  };

  return (
    <nav className="bg-gradient-to-b from-purple-950 to-purple-900 border-b border-purple-800">
      <div className="flex justify-center">
        <div className="w-full max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
            <FaGamepad className="text-3xl text-purple-400" />
            <span className="text-2xl font-bold">GameAble</span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="Search games..."
                className="w-full bg-purple-800/50 border border-purple-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Login Button */}
          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              <FaLock className="text-sm" />
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              <FaLock className="text-sm" />
              Login
            </Link>
          )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
