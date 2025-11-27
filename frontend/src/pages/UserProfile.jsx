import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaArrowLeft, FaGamepad, FaXbox, FaPlaystation, FaFacebook, FaInstagram } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const UserProfile = ({ user: currentUser }) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserProfile(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err.response?.data?.message || 'Failed to load user profile');
      setLoading(false);
    }
  };

  const getImageSrc = (profilePicture) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith('http')) return profilePicture;
    return profilePicture;
  };

  const getPlatformStatus = (platform) => {
    return platform && platform.trim() !== "" ? platform : "Not connected";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">User Not Found</h2>
          <p className="text-white/70 mb-6">{error || 'The user you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/social')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Social
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser._id === userProfile._id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-white hover:text-purple-300 transition-colors"
        >
          <FaArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Profile Card */}
        <div className="bg-black/60 backdrop-blur-xl border-2 border-purple-500/50 rounded-lg p-8 md:p-12 mb-8">
          {/* Profile Information Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Profile Picture */}
              <div className="relative">
                {getImageSrc(userProfile.profilePicture) ? (
                  <img
                    src={getImageSrc(userProfile.profilePicture)}
                    alt={userProfile.username}
                    className="w-32 h-32 rounded-full object-cover border-4 border-purple-400/50"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className={`w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center border-4 border-purple-400/50 ${getImageSrc(userProfile.profilePicture) ? 'hidden' : ''}`}
                >
                  <span className="text-white text-4xl font-bold">
                    {userProfile.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              </div>

              {/* User Details */}
              <div className="flex-1 space-y-4">
                <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {userProfile.username}
                </h1>
                <div className="text-gray-400">{userProfile.email}</div>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <FaUser className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mb-8">
            <h2 className="text-white text-lg font-bold mb-3 block">Bio</h2>
            <p className="text-white/90 bg-black/20 p-4 rounded-lg border border-purple-500/20">
              {userProfile.bio || "No bio yet."}
            </p>
          </div>

          {/* Gaming Platform Connections */}
          <div>
            <h2 className="text-white text-lg font-bold mb-4 block">Gaming Platform Connections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Steam */}
              <div className="space-y-2">
                <div className="text-purple-300 flex items-center gap-2">
                  <FaGamepad className="text-xl" />
                  <span>Steam</span>
                </div>
                <div className="bg-black/20 p-3 rounded-lg border border-purple-500/20 text-white/70">
                  {getPlatformStatus(userProfile.gamingPlatforms?.steam)}
                </div>
              </div>

              {/* Xbox Live */}
              <div className="space-y-2">
                <div className="text-green-300 flex items-center gap-2">
                  <FaXbox className="text-xl" />
                  <span>Xbox Live</span>
                </div>
                <div className="bg-black/20 p-3 rounded-lg border border-purple-500/20 text-white/70">
                  {getPlatformStatus(userProfile.gamingPlatforms?.xboxLive)}
                </div>
              </div>

              {/* PlayStation Network */}
              <div className="space-y-2">
                <div className="text-blue-300 flex items-center gap-2">
                  <FaPlaystation className="text-xl" />
                  <span>PlayStation Network</span>
                </div>
                <div className="bg-black/20 p-3 rounded-lg border border-purple-500/20 text-white/70">
                  {getPlatformStatus(userProfile.gamingPlatforms?.playstationNetwork)}
                </div>
              </div>

              {/* X (Twitter) */}
              <div className="space-y-2">
                <div className="text-cyan-300 flex items-center gap-2">
                  <FaXTwitter className="w-4 h-4" />
                  <span>X (Twitter)</span>
                </div>
                <div className="bg-black/20 p-3 rounded-lg border border-purple-500/20 text-white/70">
                  {getPlatformStatus(userProfile.gamingPlatforms?.xTwitter)}
                </div>
              </div>

              {/* Instagram */}
              <div className="space-y-2">
                <div className="text-pink-300 flex items-center gap-2">
                  <FaInstagram className="w-4 h-4" />
                  <span>Instagram</span>
                </div>
                <div className="bg-black/20 p-3 rounded-lg border border-purple-500/20 text-white/70">
                  {getPlatformStatus(userProfile.gamingPlatforms?.instagram)}
                </div>
              </div>

              {/* Facebook */}
              <div className="space-y-2">
                <div className="text-blue-400 flex items-center gap-2">
                  <FaFacebook className="w-4 h-4" />
                  <span>Facebook</span>
                </div>
                <div className="bg-black/20 p-3 rounded-lg border border-purple-500/20 text-white/70">
                  {getPlatformStatus(userProfile.gamingPlatforms?.facebook)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Favorite Games Section */}
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-6">
            Favorite Games
            {userProfile.favoriteGames && userProfile.favoriteGames.length > 0 && (
              <span className="text-white/70 text-2xl"> ({userProfile.favoriteGames.length})</span>
            )}
          </h2>

          {!userProfile.favoriteGames || userProfile.favoriteGames.length === 0 ? (
            <div className="bg-black/60 border-2 border-purple-500/30 p-12 rounded-xl text-center">
              <FaGamepad className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No favorite games yet</h3>
              <p className="text-white/70">
                {isOwnProfile 
                  ? "Start adding games to your favorites to see them here!"
                  : "This user hasn't added any favorite games yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {userProfile.favoriteGames.map((game) => (
                <div
                  key={game._id}
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
                  
                  {game.accessibilityFeatures && game.accessibilityFeatures.length > 0 && (
                    <div className="bg-black/40 pt-4 px-5 pb-4 border-t border-purple-500/20">
                      <div className="flex flex-wrap gap-2">
                        {game.accessibilityFeatures.slice(0, 3).map((feature, idx) => (
                          <span
                            key={idx}
                            className="bg-purple-900/40 border border-purple-500/30 px-2 py-1 rounded text-xs text-purple-300"
                          >
                            {feature}
                          </span>
                        ))}
                        {game.accessibilityFeatures.length > 3 && (
                          <span className="bg-purple-900/40 border border-purple-500/30 px-2 py-1 rounded text-xs text-purple-300">
                            +{game.accessibilityFeatures.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

