import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaCheck, FaTimes, FaEye, FaClock, FaCheckCircle, FaTimesCircle, FaPlusCircle, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AdminRequests = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected, added
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate("/home");
      return;
    }
    fetchRequests();
  }, [user, navigate]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/game-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (err) {
      setError("Failed to fetch game requests");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/game-requests/${requestId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchRequests();
    } catch (err) {
      setError("Failed to approve request");
      console.error(err);
    }
  };

  const handleDecline = async (requestId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/game-requests/${requestId}/decline`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchRequests();
    } catch (err) {
      setError("Failed to decline request");
      console.error(err);
    }
  };

  const handleViewDetails = (requestId) => {
    navigate(`/admin/approve-game/${requestId}`);
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to delete this game request? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`/api/game-requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.message) {
        // Success - refresh the list
        fetchRequests();
        setError(""); // Clear any previous errors
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to delete game request";
      setError(errorMessage);
      console.error("Delete request error:", err);
      
      // If it's a 401 or 403, it might be an auth issue
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("You don't have permission to delete requests. Please make sure you're logged in as an admin.");
      }
    }
  };

  const handleDeleteGame = async (gameTitle) => {
    if (!window.confirm(`Are you sure you want to delete the game "${gameTitle}"? This action cannot be undone and will remove it from the website.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      // First, find the game by title
      const gamesRes = await axios.get("/api/games", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const game = gamesRes.data.find(g => g.title.toLowerCase() === gameTitle.toLowerCase());
      
      if (game) {
        await axios.delete(`/api/games/${game._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchRequests();
        setError(""); // Clear any previous errors
      } else {
        setError("Game not found");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete game");
      console.error(err);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === "all") return true;
    return req.status === filter;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: (
        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded-full text-xs font-medium flex items-center gap-1">
          <FaClock className="w-3 h-3" />
          Pending
        </span>
      ),
      approved: (
        <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/50 rounded-full text-xs font-medium flex items-center gap-1">
          <FaCheckCircle className="w-3 h-3" />
          Approved
        </span>
      ),
      rejected: (
        <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/50 rounded-full text-xs font-medium flex items-center gap-1">
          <FaTimesCircle className="w-3 h-3" />
          Rejected
        </span>
      ),
      added: (
        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded-full text-xs font-medium flex items-center gap-1">
          <FaCheckCircle className="w-3 h-3" />
          Added
        </span>
      ),
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            🎮 Game Requests Management
          </h1>
          <p className="text-white/70">Manage and review game requests from users</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          {["all", "pending", "approved", "rejected", "added"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === status
                  ? "bg-purple-600 text-white"
                  : "bg-purple-900/40 text-white/70 hover:bg-purple-800/60"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-black/40 border-2 border-purple-500/30 backdrop-blur-xl rounded-2xl p-8 text-center">
              <p className="text-white/70">No requests found</p>
            </div>
          ) : (
            filteredRequests.map((request) => {
              // Truncate long URLs - show first 40 chars and last 20 chars
              const truncateUrl = (url) => {
                if (url.length <= 60) return url;
                return `${url.substring(0, 40)}...${url.substring(url.length - 20)}`;
              };

              return (
                <div key={request._id} className="space-y-3">
                  {/* Card Content */}
                  <div className="bg-black/60 border-2 border-purple-500/40 backdrop-blur-xl rounded-2xl p-6 hover:border-purple-500/60 transition-all">
                    <div className="flex items-start gap-3 mb-3">
                      <h3 className="text-xl font-bold text-white flex-1">{request.gameTitle}</h3>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="mb-3">
                      <a
                        href={request.gameLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 text-sm block break-all"
                        title={request.gameLink}
                      >
                        {truncateUrl(request.gameLink)}
                      </a>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {request.accessibilityFeatures?.map((feature, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-900/40 text-purple-300 rounded-lg text-xs"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      {request.userId && (
                        <p className="text-white/60">
                          Requested by: {request.userId.username || request.userId.email}
                        </p>
                      )}
                      <p className="text-white/50">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons - Outside the card */}
                  <div className="flex flex-wrap gap-2 justify-end">
                    {request.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleViewDetails(request._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium"
                        >
                          <FaEye className="w-4 h-4" />
                          Review
                        </button>
                        <button
                          onClick={() => handleApprove(request._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors font-medium"
                        >
                          <FaCheck className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleDecline(request._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors font-medium"
                        >
                          <FaTimes className="w-4 h-4" />
                          Decline
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(request._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors font-medium"
                        >
                          <FaTrash className="w-4 h-4" />
                          Delete Request
                        </button>
                      </>
                    )}
                    {request.status === "approved" && (
                      <>
                        <button
                          onClick={() => handleViewDetails(request._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors font-medium"
                        >
                          <FaPlusCircle className="w-4 h-4" />
                          Add Game
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(request._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors font-medium"
                        >
                          <FaTrash className="w-4 h-4" />
                          Delete Request
                        </button>
                      </>
                    )}
                    {(request.status === "rejected" || request.status === "added") && (
                      <button
                        onClick={() => handleDeleteRequest(request._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors font-medium"
                      >
                        <FaTrash className="w-4 h-4" />
                        Delete Request
                      </button>
                    )}
                    {request.status === "added" && (
                      <button
                        onClick={() => handleDeleteGame(request.gameTitle)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl transition-colors font-medium"
                      >
                        <FaTrash className="w-4 h-4" />
                        Delete Game
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRequests;

