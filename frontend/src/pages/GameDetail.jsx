import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaArrowLeft, 
  FaHeart, 
  FaRegHeart, 
  FaStar, 
  FaCalendar, 
  FaUser, 
  FaDownload, 
  FaExternalLinkAlt,
  FaHeadphones,
  FaHandPointer,
  FaEye,
  FaBrain,
  FaPalette,
  FaMicrophone,
  FaGamepad,
  FaClosedCaptioning,
  FaHandPaper
} from "react-icons/fa";

const GameDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, content: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchGame();
    fetchReviews();
    checkFavorite();
  }, [id, user]);

  const fetchGame = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/games/${id}`);
      setGame(res.data);
    } catch (err) {
      console.error("Error fetching game:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`/api/reviews/game/${id}`);
      setReviews(res.data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  const checkFavorite = async () => {
    if (!user) {
      setIsFavorite(false);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/users/favorites", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const favorites = res.data.favorites || [];
      setIsFavorite(favorites.some(game => game._id === id));
    } catch (err) {
      console.error("Error checking favorite:", err);
      setIsFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (isFavorite) {
        await axios.delete(`/api/users/favorites/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(false);
      } else {
        await axios.post(`/api/users/favorites/${id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      alert(err.response?.data?.message || "Failed to update favorite");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmittingReview(true);
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/reviews",
        { gameId: id, ...newReview },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewReview({ rating: 5, content: "" });
      fetchReviews();
      fetchGame(); // Refresh game to get updated review count
    } catch (err) {
      console.error("Error submitting review:", err);
      alert(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getAccessibilityIcon = (feature) => {
    const lower = feature.toLowerCase();
    if (lower.includes("hearing")) return <FaHeadphones className="w-3 h-3" />;
    if (lower.includes("dexterity")) return <FaHandPointer className="w-3 h-3" />;
    if (lower.includes("visual")) return <FaEye className="w-3 h-3" />;
    if (lower.includes("cognitive")) return <FaBrain className="w-3 h-3" />;
    if (lower.includes("colorblind") || lower.includes("color")) return <FaPalette className="w-3 h-3" />;
    if (lower.includes("voice")) return <FaMicrophone className="w-3 h-3" />;
    if (lower.includes("custom") || lower.includes("control")) return <FaGamepad className="w-3 h-3" />;
    if (lower.includes("subtitle") || lower.includes("caption")) return <FaClosedCaptioning className="w-3 h-3" />;
    if (lower.includes("one-handed") || lower.includes("hand")) return <FaHandPaper className="w-3 h-3" />;
    return <FaGamepad className="w-3 h-3" />;
  };

  const getAccessibilityColor = (feature) => {
    const lower = feature.toLowerCase();
    if (lower.includes("hearing")) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    if (lower.includes("dexterity")) return "bg-green-500/20 text-green-400 border-green-500/50";
    if (lower.includes("visual")) return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    if (lower.includes("cognitive")) return "bg-purple-500/20 text-purple-400 border-purple-500/50";
    if (lower.includes("colorblind") || lower.includes("color")) return "bg-orange-500/20 text-orange-400 border-orange-500/50";
    if (lower.includes("voice")) return "bg-pink-500/20 text-pink-400 border-pink-500/50";
    if (lower.includes("custom") || lower.includes("control")) return "bg-teal-500/20 text-teal-400 border-teal-500/50";
    if (lower.includes("subtitle") || lower.includes("caption")) return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50";
    if (lower.includes("one-handed") || lower.includes("hand")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
    return "bg-gray-500/20 text-gray-400 border-gray-500/50";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-pink-400 mb-4">Game not found</p>
          <button
            onClick={() => navigate("/home")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl font-bold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 py-8">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/home")}
          className="mb-6 flex items-center gap-2 px-5 py-2.5 bg-black/40 border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 rounded-xl font-semibold transition-all"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span>Back to Browse</span>
        </button>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Trailer */}
            {game.trailerUrl && (
              <div className="overflow-hidden border-2 border-pink-500/30 rounded-2xl shadow-xl shadow-pink-500/20 bg-black">
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    src={game.trailerUrl}
                    title={`${game.title} trailer`}
                    className="absolute top-0 left-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Hero Image */}
            <div className="overflow-hidden border-2 border-cyan-500/30 rounded-2xl shadow-xl shadow-cyan-500/20 bg-gradient-to-br from-purple-900/30 to-pink-900/30">
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={game.imageUrl}
                  alt={game.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/800x450/6B21A8/FFFFFF?text=${encodeURIComponent(game.title)}`;
                  }}
                />
                {/* PlayStation-style ribbon */}
                <div className="absolute top-4 left-0 bg-blue-600 px-4 py-2 flex items-center gap-2">
                  <span className="text-white font-bold text-sm">🎮</span>
                </div>
              </div>
            </div>

            {/* Game Info Card */}
            <div className="p-6 border-2 border-cyan-500/30 rounded-2xl shadow-lg bg-gradient-to-br from-[#16161f] to-[#1f1f2e] shadow-cyan-500/20">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <h1 className="text-cyan-400 text-2xl sm:text-3xl lg:text-4xl font-black mb-3">
                    {game.title}
                  </h1>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <FaStar className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-current" />
                      <span className="text-xl sm:text-2xl text-white font-bold">
                        {game.reviewScore || "N/A"}
                      </span>
                    </div>
                    <span className="text-sm sm:text-base text-gray-400">
                      ({(game.reviewCount || 0).toLocaleString()})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {game.genre?.split(",").map((g, idx) => (
                      <span
                        key={idx}
                        className="bg-purple-600/20 text-purple-400 px-3 py-1.5 border-2 border-purple-500/50 text-sm font-semibold rounded-full"
                      >
                        {g.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={toggleFavorite}
                  className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${
                    isFavorite
                      ? "bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg shadow-pink-500/30"
                      : "bg-white/10 hover:bg-white/20 text-white border-2 border-white/20"
                  }`}
                >
                  {isFavorite ? (
                    <FaHeart className="w-5 h-5" />
                  ) : (
                    <FaRegHeart className="w-5 h-5" />
                  )}
                  <span>{isFavorite ? "Saved" : "Save"}</span>
                </button>
              </div>

              <hr className="border-cyan-500/30 my-6" />

              <div className="space-y-4">
                <div>
                  <h2 className="text-cyan-400 text-xl font-bold mb-2">About This Game</h2>
                  <p className="text-gray-300 leading-relaxed">{game.description}</p>
                </div>

                {/* Download Button */}
                {game.downloadLink && (
                  <a
                    href={game.downloadLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-black font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-green-500/30"
                  >
                    <FaDownload className="w-5 h-5" />
                    <span>Get This Game</span>
                    <FaExternalLinkAlt className="w-4 h-4" />
                  </a>
                )}

                {/* Developer and Release Date */}
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center gap-3 p-4 bg-[#1f1f2e] rounded-xl border-2 border-purple-500/30">
                    <FaUser className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-xs text-gray-400">Developer</p>
                      <p className="text-white font-semibold">{game.developer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-[#1f1f2e] rounded-xl border-2 border-purple-500/30">
                    <FaCalendar className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-xs text-gray-400">Release Date</p>
                      <p className="text-white font-semibold">
                        {game.releaseDate || game.releaseYear}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="p-6 border-2 border-orange-500/30 rounded-2xl shadow-lg bg-gradient-to-br from-[#16161f] to-[#1f1f2e]">
              <h2 className="text-orange-400 text-xl font-bold mb-4">Reviews & Ratings</h2>

              {/* Review Form */}
              {user ? (
                <form onSubmit={handleSubmitReview} className="mb-6">
                  <div className="p-4 bg-[#1f1f2e] rounded-xl border-2 border-orange-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-gray-300">Your Rating:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                            className="focus:outline-none"
                          >
                            <FaStar
                              className={`w-6 h-6 ${
                                star <= newReview.rating
                                  ? "text-yellow-400"
                                  : "text-gray-600"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={newReview.content}
                      onChange={(e) =>
                        setNewReview({ ...newReview, content: e.target.value })
                      }
                      placeholder="Write your review..."
                      className="w-full bg-black/40 border-2 border-orange-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 resize-none"
                      rows={3}
                      required
                    />
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="mt-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-black font-bold py-2 px-6 rounded-lg transition-all disabled:opacity-50"
                    >
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-[#1f1f2e] rounded-xl border-2 border-orange-500/20 mb-6 text-center">
                  <p className="text-gray-400">
                    Please{" "}
                    <button
                      onClick={() => navigate("/login")}
                      className="text-orange-400 hover:text-orange-300 underline"
                    >
                      log in
                    </button>{" "}
                    to write a review
                  </p>
                </div>
              )}

              {/* Reviews List */}
              <h3 className="text-orange-400 font-semibold mb-3">
                Reviews ({reviews.length})
              </h3>
              {reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                      <div
                        key={review._id}
                        className="p-4 bg-[#1f1f2e] rounded-xl border-2 border-orange-500/20"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            onClick={() => navigate(`/user/${review.userId}`)}
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-cyan-400 transition-all"
                          >
                            {review.profilePicture ? (
                              <img
                                src={review.profilePicture}
                                alt={review.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-bold">
                                {review.username?.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p 
                              onClick={() => navigate(`/user/${review.userId}`)}
                              className="text-white font-semibold cursor-pointer hover:text-cyan-400 transition-colors"
                            >
                              {review.username}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {new Date(review.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? "text-yellow-400"
                                  : "text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-300">{review.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Accessibility Features */}
            <div className="p-6 border-2 border-green-500/30 rounded-2xl shadow-lg bg-gradient-to-br from-[#16161f] to-[#1f1f2e] shadow-green-500/20">
              <h2 className="text-green-400 text-lg font-bold mb-4">
                Accessibility Features
              </h2>
              <div className="flex flex-wrap gap-2">
                {game.accessibilityFeatures?.map((feature, idx) => (
                  <span
                    key={idx}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border ${getAccessibilityColor(feature)}`}
                  >
                    {getAccessibilityIcon(feature)}
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Game Features */}
            {game.features && game.features.length > 0 && (
              <div className="p-6 border-2 border-cyan-500/30 rounded-2xl shadow-lg bg-gradient-to-br from-[#16161f] to-[#1f1f2e] shadow-cyan-500/20">
                <h2 className="text-cyan-400 text-lg font-bold mb-4">Features</h2>
                <ul className="space-y-3">
                  {game.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border-2 border-cyan-500/20"
                    >
                      <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;

