import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaGamepad, FaHome, FaHeart, FaUser, FaSignOutAlt, FaUsers, FaBars, FaTimes, FaPlusCircle, FaShieldAlt } from "react-icons/fa";
import { HiMagnifyingGlass } from "react-icons/hi2";

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsMenuOpen(false);
    navigate("/home");
  };

  const isActive = (path) => {
    if (path === "/admin") {
      return location.pathname.startsWith("/admin");
    }
    if (path === "/admin/requests") {
      return location.pathname === "/admin/requests" || location.pathname.startsWith("/admin/approve-game");
    }
    return location.pathname === path;
  };

  const currentPage = location.pathname.replace("/", "") || "home";

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-black/90 backdrop-blur-xl shadow-2xl sticky top-0 z-50 border-b border-purple-500/20">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo - Left Side */}
          <button
            onClick={() => navigate("/home")}
            className="text-2xl font-bold text-white hover:scale-105 transition-transform flex items-center gap-2 sm:gap-3 group flex-shrink-0"
            aria-label="Go to home page"
          >
            <FaGamepad className="text-3xl sm:text-4xl text-purple-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">
              <span className="bg-gradient-to-r from-pink-400 to-pink-500 bg-clip-text text-transparent font-extrabold tracking-tight text-xl">Game</span>
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent font-extrabold tracking-tight text-xl">Able</span>
            </span>
            <span className="sm:hidden bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-extrabold text-lg">
              GA
            </span>
          </button>

          {/* Desktop Navigation - Center */}
          <div className="hidden lg:flex items-center gap-2 flex-1 justify-center px-6">
            {user ? (
              <>
                <button
                  onClick={() => navigate("/home")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                    isActive("/home")
                      ? "bg-purple-600/30 text-purple-300"
                      : "text-white hover:bg-purple-600/20"
                  }`}
                >
                  <FaHome className="w-5 h-5" />
                  <span>Home</span>
                </button>
                <button
                  onClick={() => navigate("/favorites")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                    isActive("/favorites")
                      ? "bg-pink-600/30 text-pink-300"
                      : "text-white hover:bg-pink-600/20"
                  }`}
                >
                  <FaHeart className="w-5 h-5" />
                  <span>Favorites</span>
                </button>
                <button
                  onClick={() => navigate("/social")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                    isActive("/social")
                      ? "bg-cyan-600/30 text-cyan-300"
                      : "text-white hover:bg-cyan-600/20"
                  }`}
                >
                  <FaUsers className="w-5 h-5" />
                  <span>Social</span>
                </button>
                <button
                  onClick={() => navigate("/profile")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                    isActive("/profile")
                      ? "bg-purple-600/30 text-purple-300"
                      : "text-white hover:bg-purple-600/20"
                  }`}
                >
                  <FaUser className="w-5 h-5" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => navigate("/request-game")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                    isActive("/request-game")
                      ? "bg-green-600/30 text-green-300"
                      : "text-white hover:bg-green-600/20"
                  }`}
                >
                  <FaPlusCircle className="w-5 h-5" />
                  <span>Request</span>
                </button>
                {user?.isAdmin && (
                  <button
                    onClick={() => navigate("/admin")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                      isActive("/admin") || isActive("/admin/requests") || isActive("/admin/approve-game")
                        ? "bg-orange-600/30 text-orange-300"
                        : "text-white hover:bg-orange-600/20"
                    }`}
                  >
                    <FaShieldAlt className="w-5 h-5" />
                    <span>Admin</span>
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white hover:bg-red-600/30 hover:text-red-300 transition-colors"
                >
                  <FaSignOutAlt className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : null}
          </div>

          {/* Desktop Search - Right Side */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            {currentPage !== "login" && currentPage !== "register" && (
              <div className="relative w-64">
                <HiMagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-black/60 backdrop-blur-md border-2 border-purple-500/40 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/50 text-white placeholder:text-gray-400 rounded-xl w-full"
                  aria-label="Search for games"
                />
              </div>
            )}
            {!user && (
              <Link
                to="/login"
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-xl shadow-purple-500/25 px-4 py-2 rounded-xl transition-colors"
              >
                <FaUser className="w-5 h-5" />
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Mobile Search Toggle */}
            {currentPage !== "login" && currentPage !== "register" && (
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-white hover:bg-purple-600/30 rounded-xl h-10 w-10 flex items-center justify-center transition-colors"
                aria-label="Toggle search"
              >
                <HiMagnifyingGlass className="w-5 h-5" />
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:bg-purple-600/30 rounded-xl h-10 w-10 flex items-center justify-center transition-colors"
              aria-label="Open menu"
            >
              {isMenuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (Expandable) */}
        {isSearchOpen && currentPage !== "login" && currentPage !== "register" && (
          <div className="lg:hidden pb-4 animate-in slide-in-from-top-2 duration-200">
            <div className="relative">
              <HiMagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5" />
              <input
                type="search"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-black/60 backdrop-blur-md border-2 border-purple-500/40 focus:border-pink-500 text-white placeholder:text-gray-400 rounded-xl w-full"
                aria-label="Search for games"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Sidebar */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          {/* Sidebar */}
          <div className="fixed right-0 top-0 h-full w-[280px] bg-gradient-to-b from-gray-950 via-purple-950 to-pink-950 border-l border-purple-500/30 z-50 lg:hidden overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent text-xl font-bold">
                  Menu
                </h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-white hover:bg-purple-600/30 rounded-lg p-2 transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {user ? (
                  <>
                    <button
                      onClick={() => handleNavigation("/home")}
                      className={`flex items-center gap-3 h-12 text-base rounded-xl px-4 transition-colors ${
                        isActive("/home")
                          ? "bg-purple-600/30 text-purple-300"
                          : "text-white hover:bg-purple-600/20"
                      }`}
                    >
                      <FaHome className="w-5 h-5" />
                      <span>Home</span>
                    </button>
                    <button
                      onClick={() => handleNavigation("/favorites")}
                      className={`flex items-center gap-3 h-12 text-base rounded-xl px-4 transition-colors ${
                        isActive("/favorites")
                          ? "bg-pink-600/30 text-pink-300"
                          : "text-white hover:bg-pink-600/20"
                      }`}
                    >
                      <FaHeart className="w-5 h-5" />
                      <span>Favorites</span>
                    </button>
                    <button
                      onClick={() => handleNavigation("/social")}
                      className={`flex items-center gap-3 h-12 text-base rounded-xl px-4 transition-colors ${
                        isActive("/social")
                          ? "bg-cyan-600/30 text-cyan-300"
                          : "text-white hover:bg-cyan-600/20"
                      }`}
                    >
                      <FaUsers className="w-5 h-5" />
                      <span>Social</span>
                    </button>
                    <button
                      onClick={() => handleNavigation("/profile")}
                      className={`flex items-center gap-3 h-12 text-base rounded-xl px-4 transition-colors ${
                        isActive("/profile")
                          ? "bg-purple-600/30 text-purple-300"
                          : "text-white hover:bg-purple-600/20"
                      }`}
                    >
                      <FaUser className="w-5 h-5" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => handleNavigation("/request-game")}
                      className={`flex items-center gap-3 h-12 text-base rounded-xl px-4 transition-colors ${
                        isActive("/request-game")
                          ? "bg-green-600/30 text-green-300"
                          : "text-white hover:bg-green-600/20"
                      }`}
                    >
                      <FaPlusCircle className="w-5 h-5" />
                      <span>Request</span>
                    </button>
                    {user?.isAdmin && (
                      <button
                        onClick={() => handleNavigation("/admin")}
                        className={`flex items-center gap-3 h-12 text-base rounded-xl px-4 transition-colors ${
                          isActive("/admin") || isActive("/admin/requests") || isActive("/admin/approve-game")
                            ? "bg-orange-600/30 text-orange-300"
                            : "text-white hover:bg-orange-600/20"
                        }`}
                      >
                        <FaShieldAlt className="w-5 h-5" />
                        <span>Admin</span>
                      </button>
                    )}
                    <div className="border-t border-purple-500/20 my-2" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 h-12 text-base text-red-400 hover:bg-red-600/20 hover:text-red-300 rounded-xl px-4 transition-colors"
                    >
                      <FaSignOutAlt className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 h-12 text-base bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl px-4 transition-colors"
                  >
                    <FaUser className="w-5 h-5" />
                    <span>Login</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Navbar;
