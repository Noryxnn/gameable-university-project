import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaGamepad, FaStar, FaMicrophone, FaUser, FaFilter } from "react-icons/fa";

const Home = ({ user, error }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await axios.get("/api/games");
        setGames(res.data);
      } catch (err) {
        console.error("Error fetching games:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  const getAccessibilityColor = (feature) => {
    const colors = {
      "Full Captions": "bg-blue-500",
      "Large Target Inputs": "bg-green-500",
      "Colorblind Mode": "bg-pink-500",
      "Screen Reader": "bg-amber-700",
    };
    return colors[feature] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-purple-950">
      {/* Hero Section */}
      <div className="flex justify-center">
        <div className="w-full max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col items-center text-center mb-16">
          {/* Hero Title */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <FaGamepad className="text-7xl text-purple-400 hidden md:block" />
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
                GameAble
              </span>
            </h1>
          </div>

          {/* Hero Description */}
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mb-8 leading-relaxed">
            Discover games built for{" "}
            <span className="text-red-400 font-semibold">everyone</span>. Browse by
            accessibility features, use{" "}
            <span className="text-blue-400 font-semibold">voice commands</span>, and find
            your perfect gaming experience!
          </p>

          {/* Hero Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              <FaStar />
              12 AAA Games
            </button>
            <button className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              <FaMicrophone />
              Voice Control
            </button>
            <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              <FaUser />
              Full Accessibility
            </button>
          </div>
        </div>

        {/* Browse Games Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
                Browse Games
              </h2>
              <span className="text-red-400 font-medium">
                {games.length} games found
              </span>
            </div>
            <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              <FaFilter />
              Filters
            </button>
          </div>

          {/* Games Grid */}
          {loading ? (
            <div className="text-center text-white text-xl py-16">Loading games...</div>
          ) : games.length === 0 ? (
            <div className="text-center text-white text-xl py-16">
              No games found. Please add games to the database.
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl">
              {games.map((game) => (
                <div
                  key={game._id}
                  className="w-full bg-purple-800/30 backdrop-blur-sm border border-purple-700 rounded-lg overflow-hidden hover:border-purple-500 transition-all hover:shadow-xl hover:shadow-purple-500/20"
                >
                  {/* Game Image */}
                  <div className="relative w-full aspect-video overflow-hidden bg-purple-900">
                    <img
                      src={game.imageUrl}
                      alt={game.title}
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/400x300/6B21A8/FFFFFF?text=" + encodeURIComponent(game.title);
                      }}
                    />
                    {/* Rating Badge */}
                    <div className="absolute top-2 left-2 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {game.rating}
                    </div>
                    {/* Release Year */}
                    <div className="absolute top-2 right-2 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {game.releaseYear}
                    </div>
                  </div>

                  {/* Game Info */}
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-white mb-2">{game.title}</h3>
                    <p className="text-purple-300 text-sm mb-3">{game.developer}</p>
                    <span className="inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium mb-3">
                      {game.genre}
                    </span>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                      {game.description}
                    </p>

                    {/* Accessibility Features */}
                    <div className="flex flex-wrap gap-2">
                      {game.accessibilityFeatures?.map((feature, idx) => (
                        <span
                          key={idx}
                          className={`${getAccessibilityColor(feature)} text-white px-3 py-1 rounded-full text-xs font-medium`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
