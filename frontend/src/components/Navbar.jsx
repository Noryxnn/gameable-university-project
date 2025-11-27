import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaGamepad, FaHome, FaHeart, FaUser, FaSignOutAlt, FaUsers, FaBars, FaTimes, FaPlusCircle, FaShieldAlt } from "react-icons/fa";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";

const Navbar = ({ 
  user, 
  setUser, 
  searchQuery, 
  setSearchQuery, 
  suggestions, 
  clearSearch 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedOutsideDesktop = searchRef.current && !searchRef.current.contains(e.target);
      const clickedOutsideMobile = !mobileSearchRef.current || !mobileSearchRef.current.contains(e.target);
      
      if (clickedOutsideDesktop && clickedOutsideMobile) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsMenuOpen(false);
    navigate("/home");
  };

  const isActive = (path) => {
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(true);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);
    setSelectedIndex(-1);
    // Navigate to home if not already there to show search results
    if (location.pathname !== "/home") {
      navigate("/home");
    }
  };

  const handleSuggestionClick = (game) => {
    setSearchQuery(game.title);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    // Navigate to the game detail page
    navigate(`/game/${game._id}`);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        handleSearchSubmit(e);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearchSubmit(e);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleClearSearch = () => {
    clearSearch();
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  // Suggestions dropdown JSX (reusable)
  const renderSuggestions = () => (
    <>
      {/* Autocomplete Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border-2 border-purple-500/40 rounded-xl shadow-2xl shadow-purple-500/20 overflow-hidden z-50">
          <ul className="py-2">
            {suggestions.map((game, index) => (
              <li key={game._id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionClick(game);
                  }}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-purple-600/30 text-white"
                      : "text-white/80 hover:bg-purple-600/20"
                  }`}
                >
                  {game.imageUrl && (
                    <img
                      src={game.imageUrl}
                      alt={game.title}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{game.title}</p>
                    <p className="text-sm text-purple-400 truncate">{game.developer}</p>
                  </div>
                  {game.genre && (
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full flex-shrink-0">
                      {game.genre}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <div className="px-4 py-2 border-t border-purple-500/20 text-xs text-gray-400">
            Press <kbd className="bg-purple-500/20 px-1.5 py-0.5 rounded text-purple-300">Enter</kbd> to search all • <kbd className="bg-purple-500/20 px-1.5 py-0.5 rounded text-purple-300">↑↓</kbd> to navigate
          </div>
        </div>
      )}

      {/* No results message */}
      {showSuggestions && searchQuery && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border-2 border-purple-500/40 rounded-xl shadow-2xl shadow-purple-500/20 overflow-hidden z-50">
          <div className="px-4 py-6 text-center">
            <p className="text-white/60">No games found for "{searchQuery}"</p>
            <p className="text-sm text-purple-400 mt-1">Try a different search term</p>
          </div>
        </div>
      )}
    </>
  );

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
                    onClick={() => navigate("/admin/requests")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                      isActive("/admin/requests") || isActive("/admin/approve-game")
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
              <div className="relative w-72" ref={searchRef}>
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <HiMagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search games or developers..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => searchQuery && setShowSuggestions(true)}
                      onKeyDown={handleKeyDown}
                      className="pl-12 pr-10 h-12 bg-black/60 backdrop-blur-md border-2 border-purple-500/40 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/50 text-white placeholder:text-gray-400 rounded-xl w-full outline-none transition-all"
                      aria-label="Search for games"
                      autoComplete="off"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleClearSearch();
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        aria-label="Clear search"
                      >
                        <HiXMark className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </form>
                {renderSuggestions()}
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
            <div className="relative w-full" ref={mobileSearchRef}>
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <HiMagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search games or developers..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => searchQuery && setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    className="pl-12 pr-10 h-12 bg-black/60 backdrop-blur-md border-2 border-purple-500/40 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/50 text-white placeholder:text-gray-400 rounded-xl w-full outline-none transition-all"
                    aria-label="Search for games"
                    autoComplete="off"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleClearSearch();
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      aria-label="Clear search"
                    >
                      <HiXMark className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </form>
              {renderSuggestions()}
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
                        onClick={() => handleNavigation("/admin/requests")}
                        className={`flex items-center gap-3 h-12 text-base rounded-xl px-4 transition-colors ${
                          isActive("/admin/requests") || isActive("/admin/approve-game")
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
