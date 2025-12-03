import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { FaSave, FaTimes, FaCheck, FaYoutube } from "react-icons/fa";
import { ALL_ACCESSIBILITY_FEATURES } from "../utils/gameConstants";

const AdminGameApproval = ({ user }) => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    developer: "",
    genre: "",
    description: "",
    releaseYear: "",
    releaseDate: "",
    imageUrl: "",
    trailerUrl: "",
    rating: "",
    accessibilityFeatures: [],
    features: [],
    downloadLink: "",
  });

  const fetchRequest = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/game-requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequest(res.data);

      // Pre-fill form with request data
      setFormData({
        title: res.data.gameTitle || "",
        developer: "",
        genre: "",
        description: "",
        releaseYear: new Date().getFullYear(),
        releaseDate: "",
        imageUrl: "",
        trailerUrl: "",
        rating: "",
        accessibilityFeatures: res.data.accessibilityFeatures || [],
        features: [],
        downloadLink: res.data.gameLink || "",
      });
    } catch (err) {
      setError("Failed to fetch game request");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    if (!user || (!user.isAdmin && !user.isCoAdmin)) {
      navigate("/home");
      return;
    }
    fetchRequest();
  }, [user, requestId, navigate, fetchRequest]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleAccessibilityToggle = (feature) => {
    setFormData((prev) => {
      const features = prev.accessibilityFeatures.includes(feature)
        ? prev.accessibilityFeatures.filter((f) => f !== feature)
        : [...prev.accessibilityFeatures, feature];
      return { ...prev, accessibilityFeatures: features };
    });
  };

  const handleFeatureAdd = () => {
    const feature = prompt("Enter a game feature:");
    if (feature && feature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, feature.trim()],
      }));
    }
  };

  const handleFeatureRemove = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const validateTrailerUrl = (url) => {
    if (!url) return true; // Optional field
    // Support YouTube URLs (various formats)
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const convertYoutubeUrl = (url) => {
    if (!url) return "";
    // Convert various YouTube URL formats to embed format
    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?]+)/,
      /youtube\.com\/embed\/([^?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }

    // If already in embed format, return as is
    if (url.includes("youtube.com/embed/")) {
      return url;
    }

    return url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate required fields
    if (
      !formData.title ||
      !formData.developer ||
      !formData.genre ||
      !formData.description ||
      !formData.releaseYear ||
      !formData.imageUrl ||
      !formData.rating
    ) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate trailer URL if provided
    if (formData.trailerUrl && !validateTrailerUrl(formData.trailerUrl)) {
      setError("Please provide a valid YouTube URL for the trailer");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const gameData = {
        ...formData,
        releaseYear: parseInt(formData.releaseYear),
        trailerUrl: formData.trailerUrl ? convertYoutubeUrl(formData.trailerUrl) : "",
      };

      // Create the game
      await axios.post("/api/games", gameData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Mark request as added
      await axios.put(
        `/api/game-requests/${requestId}/added`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess("Game created successfully!");
      setTimeout(() => {
        navigate("/admin/requests");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create game");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-xl text-white">Request not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate("/admin/requests")}
            className="mb-4 text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
          >
            <FaTimes className="w-4 h-4" />
            Back to Requests
          </button>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Approve & Add Game
          </h1>
          <p className="text-white/70">Review and add game details before publishing</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
            <p className="text-green-400 text-sm font-medium">{success}</p>
          </div>
        )}

        <div className="bg-black/60 border-2 border-purple-500/40 backdrop-blur-xl rounded-2xl p-8">
          {/* Request Info */}
          <div className="mb-6 p-4 bg-purple-900/30 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-2">Original Request</h3>
            <p className="text-white/80">Title: {request.gameTitle}</p>
            <a
              href={request.gameLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 text-sm"
            >
              {request.gameLink}
            </a>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Game Title <span className="text-pink-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-3 bg-purple-900/50 border-2 border-purple-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Developer <span className="text-pink-400">*</span>
                </label>
                <input
                  type="text"
                  name="developer"
                  value={formData.developer}
                  onChange={handleChange}
                  className="w-full p-3 bg-purple-900/50 border-2 border-purple-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Genre <span className="text-pink-400">*</span>
                </label>
                <input
                  type="text"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  className="w-full p-3 bg-purple-900/50 border-2 border-purple-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Rating <span className="text-pink-400">*</span>
                </label>
                <select
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                  className="w-full p-3 bg-purple-900/50 border-2 border-purple-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                >
                  <option value="">Select Rating</option>
                  <option value="E">E - Everyone</option>
                  <option value="E10+">E10+ - Everyone 10+</option>
                  <option value="T">T - Teen</option>
                  <option value="M">M - Mature</option>
                  <option value="AO">AO - Adults Only</option>
                </select>
              </div>

              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Release Year <span className="text-pink-400">*</span>
                </label>
                <input
                  type="number"
                  name="releaseYear"
                  value={formData.releaseYear}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear() + 5}
                  className="w-full p-3 bg-purple-900/50 border-2 border-purple-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Release Date
                </label>
                <input
                  type="text"
                  name="releaseDate"
                  value={formData.releaseDate}
                  onChange={handleChange}
                  placeholder="e.g., March 3, 2020"
                  className="w-full p-3 bg-purple-900/50 border-2 border-purple-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-purple-200 text-sm font-medium mb-2">
                Description <span className="text-pink-400">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="5"
                className="w-full p-3 bg-purple-900/50 border-2 border-purple-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-purple-200 text-sm font-medium mb-2">
                Image URL <span className="text-pink-400">*</span>
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/game-image.jpg"
                className="w-full p-3 bg-purple-900/50 border-2 border-purple-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
            </div>

            {/* Trailer URL */}
            <div>
              <label className="block text-purple-200 text-sm font-medium mb-2 flex items-center gap-2">
                <FaYoutube className="text-red-500" />
                Trailer URL (YouTube) <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="url"
                name="trailerUrl"
                value={formData.trailerUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full p-3 bg-purple-900/50 border-2 border-purple-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <p className="mt-2 text-purple-400/70 text-xs">
                Enter a YouTube URL. It will be converted to embed format automatically.
              </p>
            </div>

            {/* Download Link */}
            <div>
              <label className="block text-purple-200 text-sm font-medium mb-2">
                Download/Store Link
              </label>
              <input
                type="url"
                name="downloadLink"
                value={formData.downloadLink}
                onChange={handleChange}
                className="w-full p-3 bg-purple-900/50 border-2 border-purple-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {/* Accessibility Features */}
            <div>
              <label className="block text-purple-200 text-sm font-medium mb-2">
                Accessibility Features
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_ACCESSIBILITY_FEATURES.map((feature) => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => handleAccessibilityToggle(feature)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.accessibilityFeatures.includes(feature)
                        ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300"
                        : "bg-purple-900/40 border border-purple-700 text-white/60 hover:border-cyan-500/50"
                    }`}
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </div>

            {/* Game Features */}
            <div>
              <label className="block text-purple-200 text-sm font-medium mb-2">
                Game Features
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.features.map((feature, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-lg text-sm flex items-center gap-2"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => handleFeatureRemove(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={handleFeatureAdd}
                className="px-4 py-2 bg-purple-700/50 hover:bg-purple-700 text-white rounded-lg text-sm"
              >
                + Add Feature
              </button>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-bold transition-all disabled:cursor-not-allowed"
              >
                <FaSave className="w-4 h-4" />
                {isSubmitting ? "Creating Game..." : "Create & Publish Game"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/requests")}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminGameApproval;

