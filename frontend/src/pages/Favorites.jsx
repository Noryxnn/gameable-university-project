import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaHeart, FaMicrophone, FaClosedCaptioning, FaMousePointer, FaEye, FaPalette } from "react-icons/fa";

const Favorites = ({ user }) => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/users/favorites", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setGames(response.data.favorites || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorites = async (gameId) => {
    try {
      const token = localStorage.getItem("token");
      const isFavorite = games.some(game => game._id === gameId);
      
      if (isFavorite) {
        await axios.delete(`/api/users/favorites/${gameId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        await axios.post(`/api/users/favorites/${gameId}`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      // Refresh favorites after a short delay
      setTimeout(() => {
        fetchFavorites();
      }, 300);
    } catch (error) {
      console.error("Error toggling favorite:", error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your favorites...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <FaHeart className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-pink-500 fill-pink-500 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              My Favorites
            </h1>
          </div>
          <p className="text-white/70 text-sm sm:text-base md:text-lg font-medium">
            Games you've marked as favorites
          </p>
        </div>

        {games.length === 0 ? (
          <div className="text-center py-8 sm:py-12 md:py-16 px-4">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4 text-pink-400">&#9825;</div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">No favorites yet</h3>
            <p className="text-white/70 mb-4 text-sm sm:text-base max-w-md mx-auto">
              Browse games and click the heart icon to add them to your favorites. Build your personal collection of accessible games!
            </p>
            <button
              onClick={() => navigate("/home")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold transition-colors text-sm sm:text-base"
            >
              Browse Games
            </button>
          </div>
        ) : (
          <>
            <p className="text-white/70 mb-4 sm:mb-6 text-sm sm:text-base md:text-lg font-semibold bg-black/40 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl inline-block border border-purple-500/30">
              {games.length} game{games.length !== 1 ? 's' : ''} in your favorites
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {games.map(game => {
                const accessibility = mapAccessibility(game.accessibilityFeatures);
                return (
                  <div
                    key={game._id}
                    className="overflow-hidden hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-[1.03] transition-all duration-300 cursor-pointer group bg-black/60 border-2 border-purple-500/40 hover:border-pink-400 backdrop-blur-sm rounded-xl"
                  >
                    <div 
                      onClick={() => navigate(`/game/${game._id}`)}
                      className="relative"
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

                        {/* Favorite button overlay */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorites(game._id);
                          }}
                          className="absolute bottom-3 right-3 bg-pink-600/90 hover:bg-pink-500 text-white p-2 rounded-full shadow-lg transition-all"
                        >
                          <FaHeart className="w-5 h-5 fill-current" />
                        </button>
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
          </>
        )}
      </div>
    </div>
  );
};

export default Favorites;

