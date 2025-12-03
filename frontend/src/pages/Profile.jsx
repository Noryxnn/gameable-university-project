import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaUpload, FaEdit, FaGamepad, FaCrown } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FaFacebook, FaInstagram, FaPlaystation, FaXbox } from "react-icons/fa";

const Profile = ({ user, setUser }) => {
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    bio: "",
    profilePicture: "",
    newsletterOptIn: false,
    gamingPlatforms: {
      steam: "",
      xboxLive: "",
      playstationNetwork: "",
      xTwitter: "",
      instagram: "",
      facebook: ""
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Handle profile picture - use the path from backend
      const profilePic = res.data.profilePicture || "";
      setProfileData({
        username: res.data.username || "",
        email: res.data.email || "",
        bio: res.data.bio || "",
        profilePicture: profilePic,
        newsletterOptIn: res.data.newsletterOptIn || false,
        gamingPlatforms: {
          steam: res.data.gamingPlatforms?.steam || "",
          xboxLive: res.data.gamingPlatforms?.xboxLive || "",
          playstationNetwork: res.data.gamingPlatforms?.playstationNetwork || "",
          xTwitter: res.data.gamingPlatforms?.xTwitter || "",
          instagram: res.data.gamingPlatforms?.instagram || "",
          facebook: res.data.gamingPlatforms?.facebook || ""
        }
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      fetchProfile();
    }, 0);
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("platform_")) {
      const platformKey = name.replace("platform_", "");
      setProfileData({
        ...profileData,
        gamingPlatforms: {
          ...profileData.gamingPlatforms,
          [platformKey]: value
        }
      });
    } else {
      setProfileData({
        ...profileData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    
    // Validate username
    if (!profileData.username || profileData.username.trim() === "") {
      setError("Username cannot be empty");
      setSaving(false);
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to update your profile");
        setSaving(false);
        return;
      }
      
      console.log("Sending PUT request to /api/users/profile");
      console.log("Payload:", {
        username: profileData.username.trim(),
        bio: profileData.bio || "",
        profilePicture: profileData.profilePicture || "",
        gamingPlatforms: profileData.gamingPlatforms || {}
      });
      
      // Update profile
      const res = await axios.put(
        "/api/users/profile",
        {
          username: profileData.username.trim(),
          bio: profileData.bio || "",
          profilePicture: profileData.profilePicture || "",
          gamingPlatforms: profileData.gamingPlatforms || {}
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        }
      );

      // Update newsletter preferences separately
      try {
        await axios.put(
          "/api/users/me/preferences",
          {
            newsletterOptIn: profileData.newsletterOptIn
          },
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
          }
        );
      } catch (prefErr) {
        console.error("Error updating newsletter preferences:", prefErr);
        // Don't fail the whole profile update if preferences fail
      }
      setUser(res.data);
      setIsEditing(false);
      setSaving(false);
      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("Error updating profile:", err);
      console.error("Error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        url: err.config?.url
      });
      
      let errorMessage = "Failed to update profile";
      if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.message || `Server error: ${err.response.status} ${err.response.statusText}`;
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = "No response from server. Is the backend running on port 5050?";
      } else {
        // Something else happened
        errorMessage = err.message || "Failed to update profile";
      }
      
      setError(errorMessage);
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `Member since ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getPlatformStatus = (platform) => {
    return platform && platform.trim() !== "" ? platform : "Not connected";
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("profilePicture", file);

      const res = await axios.post("/api/users/profile/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Update profile data with new picture path
      setProfileData({
        ...profileData,
        profilePicture: res.data.profilePicture,
      });

      // Update user state
      const userRes = await axios.get("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(userRes.data);

      setUploading(false);
    } catch (err) {
      console.error("Error uploading file:", err);
      setError(err.response?.data?.message || "Failed to upload image");
      setUploading(false);
    }
  };

  const getImageSrc = (imagePath) => {
    if (!imagePath) return null;
    // If it's a local upload path, use it directly (proxy will handle it)
    if (imagePath.startsWith("/uploads/")) {
      return imagePath;
    }
    // Otherwise, it's a full URL
    return imagePath;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-purple-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 py-8 sm:py-12 md:py-20 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-black/60 backdrop-blur-xl border-2 border-purple-500/50 rounded-lg p-4 sm:p-6 md:p-8 lg:p-12">
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm sm:text-base">
                {error}
              </div>
            )}

            {/* Profile Information Section */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8 items-center sm:items-start">
                {/* Profile Picture */}
                <div className="relative flex-shrink-0">
                  {getImageSrc(profileData.profilePicture) ? (
                    <img
                      src={getImageSrc(profileData.profilePicture)}
                      alt="Profile"
                      className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-purple-400/50"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center border-4 border-purple-400/50">
                      <span className="text-white text-3xl sm:text-4xl font-bold">
                        {profileData.username?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 p-2 sm:p-3 rounded-full cursor-pointer hover:scale-110 transition-transform border-2 border-white">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      <FaUpload className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                    </label>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {/* User Details */}
                <div className="flex-1 space-y-3 sm:space-y-4 w-full text-center sm:text-left">
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        name="username"
                        value={profileData.username}
                        onChange={handleChange}
                        required
                        minLength={1}
                        className="bg-black/40 border-2 border-purple-400/30 text-white text-xl sm:text-2xl font-bold rounded-lg px-3 sm:px-4 py-2 w-full"
                        placeholder="Your name"
                      />
                      <div className="text-gray-400 text-sm sm:text-base">{profileData.email}</div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {profileData.username}
                        </h1>
                        {user?.isAdmin && (
                          <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border border-yellow-400/50 rounded-full text-xs font-bold flex items-center gap-1">
                            <FaCrown className="w-3 h-3" />
                            ADMIN
                          </span>
                        )}
                        {user?.isCoAdmin && !user?.isAdmin && (
                          <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border border-purple-400/50 rounded-full text-xs font-bold flex items-center gap-1">
                            <FaCrown className="w-3 h-3" />
                            CO-ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-sm sm:text-base">{profileData.email}</div>
                    </>
                  )}
                  <div className="text-xs sm:text-sm text-gray-500">
                    {formatDate(user?.createdAt)}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center sm:justify-start">
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm sm:text-base"
                      >
                        <FaEdit className="w-4 h-4" />
                        Edit Profile
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            handleSubmit(e);
                          }}
                          disabled={saving}
                          className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm sm:text-base"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setError("");
                            fetchProfile();
                          }}
                          className="px-4 py-2 bg-black/40 border-2 border-red-500/50 text-white hover:bg-red-900/40 rounded-lg transition-colors text-sm sm:text-base"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-white text-base sm:text-lg font-bold mb-2 sm:mb-3 block">Bio</h2>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  className="w-full bg-black/40 border-2 border-purple-400/30 text-white rounded-lg px-3 sm:px-4 py-2 sm:py-3 min-h-20 sm:min-h-24 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                />
              ) : (
                <p className="text-white/90 bg-black/20 p-3 sm:p-4 rounded-lg border border-purple-500/20 text-sm sm:text-base">
                  {profileData.bio || "No bio yet."}
                </p>
              )}
            </div>

            {/* Newsletter Preferences Section */}
            <div className="mb-8">
              <h2 className="text-white text-lg font-bold mb-3 block">Newsletter Preferences</h2>
              <label className="flex items-center gap-3 text-white/90 cursor-pointer">
                <input
                  type="checkbox"
                  name="newsletterOptIn"
                  checked={profileData.newsletterOptIn}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-5 h-5 text-pink-500 bg-black/40 border-2 border-purple-400/30 rounded focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className={!isEditing ? "text-white/70" : ""}>
                  Receive news and offers about new games
                </span>
              </label>
              {!isEditing && profileData.newsletterOptIn && (
                <p className="text-sm text-gray-400 mt-2 ml-8">
                  You're subscribed to our newsletter
                </p>
              )}
            </div>

            {/* Gaming Platform Connections */}
            <div>
              <h2 className="text-white text-base sm:text-lg font-bold mb-3 sm:mb-4 block">Gaming Platform Connections</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Steam */}
                <div className="space-y-2">
                  <div className="text-purple-300 flex items-center gap-2">
                    <FaGamepad className="text-xl" />
                    <span>Steam</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      name="platform_steam"
                      value={profileData.gamingPlatforms.steam}
                      onChange={handleChange}
                      placeholder="Steam username"
                      className="w-full bg-black/40 border-2 border-purple-400/30 text-white rounded-lg px-4 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <div className="bg-black/20 p-3 rounded-lg border border-purple-500/20 text-white/70">
                      {getPlatformStatus(profileData.gamingPlatforms.steam)}
                    </div>
                  )}
                </div>

                {/* Xbox Live */}
                <div className="space-y-2">
                  <div className="text-green-300 flex items-center gap-2">
                    <FaXbox className="text-xl" />
                    <span>Xbox Live</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      name="platform_xboxLive"
                      value={profileData.gamingPlatforms.xboxLive}
                      onChange={handleChange}
                      placeholder="Xbox Gamertag"
                      className="w-full bg-black/40 border-2 border-purple-400/30 text-white rounded-lg px-4 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <div className="bg-black/20 p-3 rounded-lg border border-purple-500/20 text-white/70">
                      {getPlatformStatus(profileData.gamingPlatforms.xboxLive)}
                    </div>
                  )}
                </div>

                {/* PlayStation Network */}
                <div className="space-y-2">
                  <div className="text-blue-300 flex items-center gap-2">
                    <FaPlaystation className="text-xl" />
                    <span>PlayStation Network</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      name="platform_playstationNetwork"
                      value={profileData.gamingPlatforms.playstationNetwork}
                      onChange={handleChange}
                      placeholder="PSN ID"
                      className="w-full bg-black/40 border-2 border-purple-400/30 text-white rounded-lg px-4 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <div className="bg-black/20 p-3 rounded-lg border border-purple-500/20 text-white/70">
                      {getPlatformStatus(profileData.gamingPlatforms.playstationNetwork)}
                    </div>
                  )}
                </div>

                {/* X (Twitter) */}
                <div className="space-y-2">
                  <div className="text-cyan-300 flex items-center gap-2">
                    <FaXTwitter className="w-4 h-4" />
                    <span>X (Twitter)</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      name="platform_xTwitter"
                      value={profileData.gamingPlatforms.xTwitter}
                      onChange={handleChange}
                      placeholder="@username"
                      className="w-full bg-black/40 border-2 border-purple-400/30 text-white rounded-lg px-4 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <div className="bg-black/20 p-3 rounded-lg border border-purple-500/20 text-white/70">
                      {getPlatformStatus(profileData.gamingPlatforms.xTwitter)}
                    </div>
                  )}
                </div>

                {/* Instagram */}
                <div className="space-y-2">
                  <div className="text-pink-300 flex items-center gap-2">
                    <FaInstagram className="w-4 h-4" />
                    <span>Instagram</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      name="platform_instagram"
                      value={profileData.gamingPlatforms.instagram}
                      onChange={handleChange}
                      placeholder="@username"
                      className="w-full bg-black/40 border-2 border-purple-400/30 text-white rounded-lg px-4 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <div className="bg-black/20 p-3 rounded-lg border border-purple-500/20 text-white/70">
                      {getPlatformStatus(profileData.gamingPlatforms.instagram)}
                    </div>
                  )}
                </div>

                {/* Facebook */}
                <div className="space-y-2">
                  <div className="text-blue-400 flex items-center gap-2">
                    <FaFacebook className="w-4 h-4" />
                    <span>Facebook</span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      name="platform_facebook"
                      value={profileData.gamingPlatforms.facebook}
                      onChange={handleChange}
                      placeholder="facebook.com/username"
                      className="w-full bg-black/40 border-2 border-purple-400/30 text-white rounded-lg px-4 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <div className="bg-black/20 p-3 rounded-lg border border-purple-500/20 text-white/70">
                      {getPlatformStatus(profileData.gamingPlatforms.facebook)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Profile;

