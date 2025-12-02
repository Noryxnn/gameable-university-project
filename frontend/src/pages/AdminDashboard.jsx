import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaUsers, 
  FaClipboardList, 
  FaSearch, 
  FaBan, 
  FaCheckCircle,
  FaTrash,
  FaEye,
  FaUser
} from "react-icons/fa";

const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all, banned, active
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate("/home");
      return;
    }
    fetchUsers();
    fetchRequestCount();
  }, [user, navigate]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      // Use search endpoint with empty query for admins (returns all users)
      const res = await axios.get("/api/users/search?q=", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/game-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pendingCount = res.data.filter(r => r.status === 'pending').length;
      setRequestCount(pendingCount);
    } catch (err) {
      console.error("Error fetching request count:", err);
    }
  };

  const filterUsers = useCallback(() => {
    let filtered = users;

    // Apply status filter
    if (filter === "banned") {
      filtered = filtered.filter(u => u.isBanned);
    } else if (filter === "active") {
      filtered = filtered.filter(u => !u.isBanned);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.username?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, filter]);

  const handleBanUser = async (userId, isBanned) => {
    if (!window.confirm(`Are you sure you want to ${isBanned ? 'unban' : 'ban'} this user?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const endpoint = isBanned 
        ? `/api/users/${userId}/unban`
        : `/api/users/${userId}/ban`;
      
      await axios.put(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to ban/unban user");
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE ${username}? This action cannot be undone.`)) {
      return;
    }

    if (!window.confirm(`This is your final warning. Delete ${username}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
      console.error(err);
    }
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
            🛡️ Admin Dashboard
          </h1>
          <p className="text-white/70">Manage users, requests, and content</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Admin Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Game Requests Card */}
          <div
            onClick={() => navigate("/admin/requests")}
            className="bg-black/60 border-2 border-purple-500/40 backdrop-blur-xl rounded-2xl p-6 hover:border-purple-500/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                  <FaClipboardList className="text-purple-400" />
                  Game Requests
                </h3>
                <p className="text-white/70 mb-4">Manage game requests from users</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-purple-400">{requestCount}</span>
                  <span className="text-white/60">pending requests</span>
                </div>
              </div>
              <div className="text-purple-400 group-hover:text-purple-300 transition-colors">
                <FaEye className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Users Management Card */}
          <div className="bg-black/60 border-2 border-cyan-500/40 backdrop-blur-xl rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <FaUsers className="text-cyan-400" />
                Users Management
              </h3>
            </div>
            <p className="text-white/70 mb-4">View, search, and manage all users</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-cyan-400">{users.length}</span>
              <span className="text-white/60">total users</span>
            </div>
          </div>
        </div>

        {/* Users Management Section */}
        <div className="bg-black/60 border-2 border-cyan-500/40 backdrop-blur-xl rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <FaUsers className="text-cyan-400" />
            All Users
          </h2>

          {/* Search and Filter */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-purple-900/50 border-2 border-purple-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex gap-2">
              {["all", "active", "banned"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    filter === status
                      ? "bg-cyan-600 text-white"
                      : "bg-purple-900/40 text-white/70 hover:bg-purple-800/60"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/70">No users found</p>
              </div>
            ) : (
              filteredUsers.map((userItem) => (
                <div
                  key={userItem._id}
                  className="bg-purple-900/30 border-2 border-purple-500/30 rounded-xl p-4 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                        {userItem.profilePicture ? (
                          <img
                            src={userItem.profilePicture}
                            alt={userItem.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-lg">
                            {userItem.username?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-bold text-lg">{userItem.username}</h3>
                          {userItem.isBanned && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/50 rounded-full text-xs font-medium">
                              BANNED
                            </span>
                          )}
                          {userItem.isAdmin && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/50 rounded-full text-xs font-medium">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-white/60 text-sm">{userItem.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/user/${userItem._id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium"
                        title="View Profile"
                      >
                        <FaEye className="w-4 h-4" />
                        View
                      </button>
                      {!userItem.isAdmin && (
                        <>
                          <button
                            onClick={() => handleBanUser(userItem._id, userItem.isBanned)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors font-medium ${
                              userItem.isBanned
                                ? "bg-green-600 hover:bg-green-500 text-white"
                                : "bg-orange-600 hover:bg-orange-500 text-white"
                            }`}
                            title={userItem.isBanned ? "Unban User" : "Ban User"}
                          >
                            {userItem.isBanned ? (
                              <>
                                <FaCheckCircle className="w-4 h-4" />
                                Unban
                              </>
                            ) : (
                              <>
                                <FaBan className="w-4 h-4" />
                                Ban
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(userItem._id, userItem.username)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors font-medium"
                            title="Delete User"
                          >
                            <FaTrash className="w-4 h-4" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

