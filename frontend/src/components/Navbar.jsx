import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaGamepad, FaHome, FaHeart, FaUser, FaSignOutAlt, FaUsers, FaBars, FaTimes, FaPlusCircle, FaShieldAlt, FaCog } from "react-icons/fa";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";

const SEARCH_INPUT_MAX_LENGTH = 60;

const Navbar = ({ 
  user, 
  setUser, 
  searchQuery, 
  setSearchQuery, 
  suggestions, 
  clearSearch,
  commitSearch 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Close menus when route changes
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      // Use requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => {
        setIsSearchOpen(false);
        setIsProfileDropdownOpen(false);
      });
    }
  }, [location.pathname]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


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
    if (suggestions.length === 0) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => setSelectedIndex(-1), 0);
    }
  }, [suggestions]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsProfileDropdownOpen(false);
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

  const handleHomeNavigation = () => {
    clearSearch();
    setIsProfileDropdownOpen(false);
    navigate("/home");
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(true);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);
    setSelectedIndex(-1);
    // Commit the search to filter results
    commitSearch();
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
            Press <kbd className="bg-purple-500/20 px-1.5 py-0.5 rounded text-purple-300">Enter</kbd> to search all - <kbd className="bg-purple-500/20 px-1.5 py-0.5 rounded text-purple-300">Up/Down</kbd> to navigate
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
            onClick={handleHomeNavigation}
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

          {/* Desktop Navigation - Center (xl screens only - true desktop) */}
          <div className="hidden xl:flex items-center gap-2 flex-1 justify-center px-6">
             {user ? (
              <>
                <button
                  onClick={handleHomeNavigation}
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
              </>
            ) : null}
          </div>

          {/* Desktop Search & Profile - Right Side (xl screens only) */}
          <div className="hidden xl:flex items-center gap-3 flex-shrink-0">
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
                      maxLength={SEARCH_INPUT_MAX_LENGTH}
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
            
            {/* Profile Picture Dropdown */}
            {user ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full border-2 border-transparent hover:border-purple-500/50 transition-all"
                  aria-label="Open profile menu"
                >
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/50"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-purple-500/50 ${user.profilePicture ? "hidden" : ""}`}
                  >
                    {user.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                </button>

                {/* Dropdown Menu - Responsive for all screens */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-xl border-2 border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-500/20 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Info Header */}
                    <div className="px-4 py-4 border-b border-purple-500/20 bg-black/30">
                      <div className="flex items-center gap-3">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/50"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-purple-500/50">
                            {user.username?.charAt(0).toUpperCase() || "U"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold truncate">{user.username}</p>
                          <p className="text-purple-400 text-sm truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items - Touch-friendly sizing */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setIsProfileDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors active:scale-[0.98] ${
                          isActive("/profile")
                            ? "bg-purple-600/30 text-purple-300"
                            : "text-white/80 hover:bg-purple-600/20"
                        }`}
                      >
                        <FaUser className="w-5 h-5" />
                        <span className="font-medium">Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate("/settings");
                          setIsProfileDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors active:scale-[0.98] ${
                          isActive("/settings")
                            ? "bg-purple-600/30 text-purple-300"
                            : "text-white/80 hover:bg-purple-600/20"
                        }`}
                      >
                        <FaCog className="w-5 h-5" />
                        <span className="font-medium">Settings</span>
                      </button>
                      {(user?.isAdmin || user?.isCoAdmin) && (
                        <button
                          onClick={() => {
                            navigate("/admin");
                            setIsProfileDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors active:scale-[0.98] ${
                            isActive("/admin") || isActive("/admin/requests") || isActive("/admin/approve-game")
                              ? "bg-orange-600/30 text-orange-300"
                              : "text-white/80 hover:bg-orange-600/20"
                          }`}
                        >
                          <FaShieldAlt className="w-5 h-5" />
                          <span className="font-medium">Admin Panel</span>
                        </button>
                      )}
                    </div>
                    
                    {/* Logout */}
                    <div className="border-t border-purple-500/20 py-2">
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-4 px-4 py-3 text-left text-red-400 hover:bg-red-600/20 active:scale-[0.98] transition-colors"
                      >
                        <FaSignOutAlt className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-xl shadow-purple-500/25 px-4 py-2 rounded-xl transition-colors"
              >
                <FaUser className="w-5 h-5" />
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile/Tablet Actions (below xl screens) */}
          <div className="flex xl:hidden items-center gap-1 sm:gap-2">
            {/* Search Toggle */}
            {currentPage !== "login" && currentPage !== "register" && (
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-white hover:bg-purple-600/30 rounded-xl h-10 w-10 flex items-center justify-center transition-colors"
                aria-label="Toggle search"
              >
                <HiMagnifyingGlass className="w-5 h-5" />
              </button>
            )}

            {user ? (
              <>
                {/* Settings Button */}
                <button
                  onClick={() => navigate("/settings")}
                  className={`h-10 w-10 flex items-center justify-center rounded-xl transition-colors ${
                    isActive("/settings")
                      ? "bg-purple-600/30 text-purple-300"
                      : "text-white/70 hover:bg-purple-600/20 hover:text-white"
                  }`}
                  aria-label="Settings"
                >
                  <FaCog className="w-5 h-5" />
                </button>

                {/* Admin Panel Button (if admin) */}
                {(user?.isAdmin || user?.isCoAdmin) && (
                  <button
                    onClick={() => navigate("/admin")}
                    className={`h-10 w-10 flex items-center justify-center rounded-xl transition-colors ${
                      isActive("/admin") || isActive("/admin/requests") || isActive("/admin/approve-game")
                        ? "bg-orange-600/30 text-orange-300"
                        : "text-white/70 hover:bg-orange-600/20 hover:text-orange-300"
                    }`}
                    aria-label="Admin Panel"
                  >
                    <FaShieldAlt className="w-5 h-5" />
                  </button>
                )}

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="h-10 w-10 flex items-center justify-center rounded-xl text-white/70 hover:bg-red-600/20 hover:text-red-400 transition-colors"
                  aria-label="Logout"
                >
                  <FaSignOutAlt className="w-5 h-5" />
                </button>

                {/* Profile Picture - Direct link to profile */}
                <button
                  onClick={() => navigate("/profile")}
                  className={`flex items-center p-1 rounded-full border-2 transition-all active:scale-95 ${
                    isActive("/profile")
                      ? "border-purple-500"
                      : "border-transparent hover:border-purple-500/50"
                  }`}
                  aria-label="Go to profile"
                >
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/50"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-purple-500/50 ${user.profilePicture ? "hidden" : ""}`}
                  >
                    {user.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 px-3 py-2 rounded-xl transition-colors text-sm font-medium"
              >
                <FaUser className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile/Tablet Search Bar (Expandable) */}
        {isSearchOpen && currentPage !== "login" && currentPage !== "register" && (
          <div className="xl:hidden pb-4 animate-in slide-in-from-top-2 duration-200">
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
                    maxLength={SEARCH_INPUT_MAX_LENGTH}
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

      {/* Mobile Bottom Navigation Bar - Only on small screens (phones) */}
      {user && (
        <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-black/95 backdrop-blur-xl border-t border-purple-500/30 safe-area-bottom">
          <div className="flex items-center justify-around h-16 px-1">
            <button
              onClick={handleHomeNavigation}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors no-min-touch ${
                isActive("/home") ? "text-purple-400" : "text-white/60"
              }`}
              aria-label="Home"
            >
              <FaHome className={`w-5 h-5 ${isActive("/home") ? "scale-110" : ""} transition-transform`} />
              <span className="text-[10px] mt-1 font-medium">Home</span>
            </button>
            <button
              onClick={() => navigate("/favorites")}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors no-min-touch ${
                isActive("/favorites") ? "text-pink-400" : "text-white/60"
              }`}
              aria-label="Favorites"
            >
              <FaHeart className={`w-5 h-5 ${isActive("/favorites") ? "scale-110" : ""} transition-transform`} />
              <span className="text-[10px] mt-1 font-medium">Favorites</span>
            </button>
            <button
              onClick={() => navigate("/social")}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors no-min-touch ${
                isActive("/social") ? "text-cyan-400" : "text-white/60"
              }`}
              aria-label="Social"
            >
              <FaUsers className={`w-5 h-5 ${isActive("/social") ? "scale-110" : ""} transition-transform`} />
              <span className="text-[10px] mt-1 font-medium">Social</span>
            </button>
            <button
              onClick={() => navigate("/settings")}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors no-min-touch ${
                isActive("/settings") ? "text-purple-400" : "text-white/60"
              }`}
              aria-label="Settings"
            >
              <FaCog className={`w-5 h-5 ${isActive("/settings") ? "scale-110" : ""} transition-transform`} />
              <span className="text-[10px] mt-1 font-medium">Settings</span>
            </button>
            <button
              onClick={() => navigate("/profile")}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors no-min-touch ${
                isActive("/profile") ? "text-purple-400" : "text-white/60"
              }`}
              aria-label="Profile"
            >
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.username}
                  className={`w-6 h-6 rounded-full object-cover ${isActive("/profile") ? "ring-2 ring-purple-400" : "ring-1 ring-purple-500/50"}`}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div 
                className={`w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-[10px] ${isActive("/profile") ? "ring-2 ring-purple-400" : "ring-1 ring-purple-500/50"} ${user.profilePicture ? "hidden" : ""}`}
              >
                {user.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="text-[10px] mt-1 font-medium">Profile</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-white/60 hover:text-red-400 transition-colors no-min-touch"
              aria-label="Logout"
            >
              <FaSignOutAlt className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">Logout</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
