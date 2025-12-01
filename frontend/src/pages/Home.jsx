import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaFilter, FaTimes, FaMicrophone, FaClosedCaptioning, FaMousePointer, FaEye, FaPalette, FaHeart, FaRegHeart } from "react-icons/fa";
import { HiXMark } from "react-icons/hi2";

const Home = ({ user, games, filteredGames: searchFilteredGames, gamesLoading, activeSearch, clearSearch }) => {
  const navigate = useNavigate();
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    voiceControl: false,
    fullCaptions: false,
    largeTargetInputs: false,
    colorblindMode: false,
    screenReader: false,
  });

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/users/favorites", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const favorites = res.data.favorites || [];
      setFavoriteIds(new Set(favorites.map(game => game._id)));
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  };

  const toggleFavorite = async (gameId, e) => {
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const isFavorite = favoriteIds.has(gameId);
      
      if (isFavorite) {
        await axios.delete(`/api/users/favorites/${gameId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(gameId);
          return newSet;
        });
      } else {
        await axios.post(`/api/users/favorites/${gameId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavoriteIds(prev => new Set([...prev, gameId]));
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      alert(err.response?.data?.message || "Failed to update favorite");
    }
  };

  // Map accessibility features array to object
  const mapAccessibility = (features) => {
    if (!features || !Array.isArray(features)) {
      return {
        voiceControl: false,
        fullCaptions: false,
        largeTargetInputs: false,
        colorblindMode: false,
        screenReader: false,
      };
    }
    return {
      voiceControl: features.some(f => f.toLowerCase().includes("voice") || f.toLowerCase().includes("voice control")),
      fullCaptions: features.some(f => f.toLowerCase().includes("caption") || f.toLowerCase().includes("subtitle")),
      largeTargetInputs: features.some(f => f.toLowerCase().includes("large") || f.toLowerCase().includes("target")),
      colorblindMode: features.some(f => f.toLowerCase().includes("colorblind") || f.toLowerCase().includes("color")),
      screenReader: features.some(f => f.toLowerCase().includes("screen reader") || f.toLowerCase().includes("reader")),
    };
  };

  // Apply accessibility filters to search-filtered games
  const filteredGames = useMemo(() => {
    const gamesToFilter = searchFilteredGames || games || [];
    const hasActiveFilters = Object.values(filters).some(f => f);
    
    if (!hasActiveFilters) return gamesToFilter;

    return gamesToFilter.filter(game => {
      const accessibility = mapAccessibility(game.accessibilityFeatures);
      return (
        (!filters.voiceControl || accessibility.voiceControl) &&
        (!filters.fullCaptions || accessibility.fullCaptions) &&
        (!filters.largeTargetInputs || accessibility.largeTargetInputs) &&
        (!filters.colorblindMode || accessibility.colorblindMode) &&
        (!filters.screenReader || accessibility.screenReader)
      );
    });
  }, [searchFilteredGames, games, filters]);

  const toggleFilter = (filterKey) => {
    setFilters({ ...filters, [filterKey]: !filters[filterKey] });
  };

  const clearFilters = () => {
    setFilters({
      voiceControl: false,
      fullCaptions: false,
      largeTargetInputs: false,
      colorblindMode: false,
      screenReader: false,
    });
  };

  const clearAllFiltersAndSearch = () => {
    clearFilters();
    if (clearSearch) clearSearch();
  };

  if (gamesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading games...</div>
      </div>
    );
  }

  const totalGames = games?.length || 0;
  const hasActiveFilters = Object.values(filters).some(f => f);
  const isSearching = activeSearch && activeSearch.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      {/* Hero Section */}
      <div className="relative py-20 mb-8 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-pink-900/30 to-cyan-900/50"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDE2OCw4NSwyNDcsMC4xNSkiLz48L2c+PC9zdmc+')] opacity-40"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center px-4 sm:px-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
              🎮 GameAble
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-6 sm:mb-8 md:mb-10 leading-relaxed px-2">
              Discover games built for <span className="text-pink-400 font-bold">everyone</span>. Browse by accessibility features, 
              use <span className="text-cyan-400 font-bold">voice commands</span>, and find your perfect gaming experience!
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4 justify-center px-2">
              <div className="bg-gradient-to-r from-purple-600/20 to-purple-500/20 backdrop-blur-xl px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border-2 border-purple-400/40 shadow-xl shadow-purple-500/20">
                <span className="text-white font-bold text-sm sm:text-base md:text-lg">✨ {totalGames} AAA Games</span>
              </div>
              <div className="bg-gradient-to-r from-pink-600/20 to-pink-500/20 backdrop-blur-xl px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border-2 border-pink-400/40 shadow-xl shadow-pink-500/20">
                <span className="text-white font-bold text-sm sm:text-base md:text-lg">🎤 Voice Control</span>
              </div>
              <div className="bg-gradient-to-r from-cyan-600/20 to-cyan-500/20 backdrop-blur-xl px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border-2 border-cyan-400/40 shadow-xl shadow-cyan-500/20">
                <span className="text-white font-bold text-sm sm:text-base md:text-lg">♿ Full Accessibility</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 pb-8">
        {/* Search indicator */}
        {isSearching && (
          <div className="mb-6 p-4 bg-purple-900/30 border-2 border-purple-500/30 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-white/70">Showing results for: </span>
              <span className="text-pink-400 font-bold">"{activeSearch}"</span>
              <span className="text-white/50 ml-2">({filteredGames.length} {filteredGames.length === 1 ? 'game' : 'games'})</span>
            </div>
            <button
              onClick={clearSearch}
              className="flex items-center gap-2 text-white/70 hover:text-white bg-purple-600/20 hover:bg-purple-600/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              <HiXMark className="w-4 h-4" />
              Clear search
            </button>
          </div>
        )}

        <div className="mb-6 sm:mb-8 flex items-center justify-between flex-wrap gap-3 sm:gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-1 sm:mb-2">
              {isSearching ? 'Search Results' : 'Browse Games'}
            </h2>
            <p className="text-white/70 text-sm sm:text-base md:text-lg">
              <span className="text-pink-400 font-bold">{filteredGames.length}</span> {filteredGames.length === 1 ? 'game' : 'games'} found
            </p>
          </div>
        
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-3 bg-black/40 border-2 border-purple-500/60 hover:border-pink-400 text-white hover:bg-purple-600/20 backdrop-blur-xl shadow-xl shadow-purple-500/20 rounded-xl font-bold px-4 py-2 transition-colors"
            aria-label={showFilters ? 'Hide filters' : 'Show filters'}
          >
            <FaFilter className="w-5 h-5 text-pink-400" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold shadow-lg shadow-pink-500/50 text-sm">
                {Object.values(filters).filter(f => f).length}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mb-8 p-8 bg-black/60 border-2 border-purple-500/40 backdrop-blur-xl shadow-2xl shadow-purple-500/20 rounded-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-white flex items-center gap-3">
                <FaFilter className="w-7 h-7 text-pink-400" />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Accessibility Filters
                </span>
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-white hover:text-pink-300 hover:bg-pink-900/30 rounded-xl font-semibold px-4 py-2 transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                  Clear all
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div 
                className={`flex items-center space-x-4 p-5 rounded-2xl transition-all cursor-pointer border-2 font-semibold ${
                  filters.voiceControl 
                    ? 'bg-gradient-to-br from-purple-600/40 to-purple-500/30 border-purple-400 shadow-xl shadow-purple-500/30 scale-105' 
                    : 'bg-black/40 border-purple-500/30 hover:border-purple-400 hover:bg-purple-900/20'
                }`} 
                onClick={() => toggleFilter('voiceControl')}
              >
                <input
                  type="checkbox"
                  id="voice-control"
                  checked={filters.voiceControl}
                  onChange={() => toggleFilter('voiceControl')}
                  className="w-5 h-5 border-2 rounded cursor-pointer"
                />
                <label htmlFor="voice-control" className="cursor-pointer flex items-center gap-3 text-white text-base">
                  <FaMicrophone className="w-6 h-6 text-purple-400" />
                  Voice Control
                </label>
              </div>
              
              <div 
                className={`flex items-center space-x-4 p-5 rounded-2xl transition-all cursor-pointer border-2 font-semibold ${
                  filters.fullCaptions 
                    ? 'bg-gradient-to-br from-cyan-600/40 to-cyan-500/30 border-cyan-400 shadow-xl shadow-cyan-500/30 scale-105' 
                    : 'bg-black/40 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-900/20'
                }`} 
                onClick={() => toggleFilter('fullCaptions')}
              >
                <input
                  type="checkbox"
                  id="full-captions"
                  checked={filters.fullCaptions}
                  onChange={() => toggleFilter('fullCaptions')}
                  className="w-5 h-5 border-2 rounded cursor-pointer"
                />
                <label htmlFor="full-captions" className="cursor-pointer flex items-center gap-3 text-white text-base">
                  <FaClosedCaptioning className="w-6 h-6 text-cyan-400" />
                  Full Captions
                </label>
              </div>
              
              <div 
                className={`flex items-center space-x-4 p-5 rounded-2xl transition-all cursor-pointer border-2 font-semibold ${
                  filters.largeTargetInputs 
                    ? 'bg-gradient-to-br from-green-600/40 to-green-500/30 border-green-400 shadow-xl shadow-green-500/30 scale-105' 
                    : 'bg-black/40 border-green-500/30 hover:border-green-400 hover:bg-green-900/20'
                }`} 
                onClick={() => toggleFilter('largeTargetInputs')}
              >
                <input
                  type="checkbox"
                  id="large-targets"
                  checked={filters.largeTargetInputs}
                  onChange={() => toggleFilter('largeTargetInputs')}
                  className="w-5 h-5 border-2 rounded cursor-pointer"
                />
                <label htmlFor="large-targets" className="cursor-pointer flex items-center gap-3 text-white text-base">
                  <FaMousePointer className="w-6 h-6 text-green-400" />
                  Large Inputs
                </label>
              </div>
              
              <div 
                className={`flex items-center space-x-4 p-5 rounded-2xl transition-all cursor-pointer border-2 font-semibold ${
                  filters.screenReader 
                    ? 'bg-gradient-to-br from-blue-600/40 to-blue-500/30 border-blue-400 shadow-xl shadow-blue-500/30 scale-105' 
                    : 'bg-black/40 border-blue-500/30 hover:border-blue-400 hover:bg-blue-900/20'
                }`} 
                onClick={() => toggleFilter('screenReader')}
              >
                <input
                  type="checkbox"
                  id="screen-reader"
                  checked={filters.screenReader}
                  onChange={() => toggleFilter('screenReader')}
                  className="w-5 h-5 border-2 rounded cursor-pointer"
                />
                <label htmlFor="screen-reader" className="cursor-pointer flex items-center gap-3 text-white text-base">
                  <FaEye className="w-6 h-6 text-blue-400" />
                  Screen Reader
                </label>
              </div>
              
              <div 
                className={`flex items-center space-x-4 p-5 rounded-2xl transition-all cursor-pointer border-2 font-semibold ${
                  filters.colorblindMode 
                    ? 'bg-gradient-to-br from-pink-600/40 to-pink-500/30 border-pink-400 shadow-xl shadow-pink-500/30 scale-105' 
                    : 'bg-black/40 border-pink-500/30 hover:border-pink-400 hover:bg-pink-900/20'
                }`} 
                onClick={() => toggleFilter('colorblindMode')}
              >
                <input
                  type="checkbox"
                  id="colorblind-mode"
                  checked={filters.colorblindMode}
                  onChange={() => toggleFilter('colorblindMode')}
                  className="w-5 h-5 border-2 rounded cursor-pointer"
                />
                <label htmlFor="colorblind-mode" className="cursor-pointer flex items-center gap-3 text-white text-base">
                  <FaPalette className="w-6 h-6 text-pink-400" />
                  Colorblind Mode
                </label>
              </div>
            </div>
          </div>
        )}

        {filteredGames.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">No games found</h3>
            <p className="text-white/70 mb-4">
              {isSearching 
                ? `No games match your search for "${activeSearch}". Try different keywords or clear your filters.`
                : "No games match your current filters. Try adjusting your accessibility filters to see more results."}
            </p>
            {(hasActiveFilters || isSearching) && (
              <button
                onClick={clearAllFiltersAndSearch}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl font-bold transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {filteredGames.map(game => {
              const accessibility = mapAccessibility(game.accessibilityFeatures);
              return (
                <div
                  key={game._id}
                  onClick={() => navigate(`/game/${game._id}`)}
                  className="overflow-hidden hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-[1.03] transition-all duration-300 cursor-pointer group bg-black/60 border-2 border-purple-500/40 hover:border-pink-400 backdrop-blur-sm rounded-xl"
                >
                  <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-purple-900/30 to-pink-900/30">
                    <img
                      src={game.imageUrl}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/400x300/6B21A8/FFFFFF?text=" + encodeURIComponent(game.title);
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {game.rating && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-pink-600 backdrop-blur-md px-4 py-1.5 rounded-full border border-purple-400/50 shadow-lg">
                        <span className="text-white text-sm font-bold">{game.rating}</span>
                      </div>
                    )}
                    
                    {game.releaseYear && (
                      <div className="absolute top-3 right-3 bg-purple-900/30 backdrop-blur-md px-3 py-1 rounded-full border border-purple-500/30">
                        <span className="text-sm text-purple-400 font-bold">{game.releaseYear}</span>
                      </div>
                    )}

                    {/* Favorite button */}
                    {user && (
                      <button
                        onClick={(e) => toggleFavorite(game._id, e)}
                        className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 backdrop-blur-md p-2 rounded-full border-2 border-pink-500/50 hover:border-pink-400 transition-all shadow-lg"
                        title={favoriteIds.has(game._id) ? "Remove from favorites" : "Add to favorites"}
                      >
                        {favoriteIds.has(game._id) ? (
                          <FaHeart className="w-5 h-5 text-pink-500 fill-pink-500" />
                        ) : (
                          <FaRegHeart className="w-5 h-5 text-pink-500" />
                        )}
                      </button>
                    )}
                  </div>
                  
                  <div className="pt-5 pb-4 px-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-2xl font-black text-white line-clamp-1 flex-1 group-hover:text-pink-400 transition-colors">
                        {game.title}
                      </h3>
                    </div>
                    
                    <p className="text-white/70 text-sm mb-2 font-semibold">{game.developer}</p>
                    <p className="text-cyan-400 text-sm mb-3 font-bold">{game.genre}</p>
                    <p className="text-white/80 line-clamp-2 mb-4 leading-relaxed">
                      {game.description}
                    </p>
                  </div>
                  
                  <div className="bg-black/40 pt-4 px-5 pb-4 border-t border-purple-500/20">
                    <div className="flex flex-wrap gap-2">
                      {accessibility.voiceControl && (
                        <span className="bg-purple-600/30 text-purple-300 px-3 py-1 rounded-full text-xs font-medium border border-purple-500/30">
                          Voice Control
                        </span>
                      )}
                      {accessibility.fullCaptions && (
                        <span className="bg-cyan-600/30 text-cyan-300 px-3 py-1 rounded-full text-xs font-medium border border-cyan-500/30">
                          Full Captions
                        </span>
                      )}
                      {accessibility.largeTargetInputs && (
                        <span className="bg-green-600/30 text-green-300 px-3 py-1 rounded-full text-xs font-medium border border-green-500/30">
                          Large Inputs
                        </span>
                      )}
                      {accessibility.colorblindMode && (
                        <span className="bg-pink-600/30 text-pink-300 px-3 py-1 rounded-full text-xs font-medium border border-pink-500/30">
                          Colorblind Mode
                        </span>
                      )}
                      {accessibility.screenReader && (
                        <span className="bg-blue-600/30 text-blue-300 px-3 py-1 rounded-full text-xs font-medium border border-blue-500/30">
                          Screen Reader
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
