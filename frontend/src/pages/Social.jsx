import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaUserPlus, FaUserMinus, FaUser, FaUsers, FaTimes } from 'react-icons/fa';

const Social = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user]);

  const searchUsers = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data.users || []);
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const debounceTimer = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchUsers]);

  const loadFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/users/friends/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(res.data.friends || []);
      setReceivedRequests(res.data.receivedRequests || []);
      setSentRequests(res.data.sentRequests || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading friends:', err);
      setError('Failed to load friends');
      setLoading(false);
    }
  };

  const handleSendRequest = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/users/friends/request/${friendId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadFriends();
      if (activeTab === 'search') {
        await searchUsers();
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
      setError(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/users/friends/accept/${friendId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadFriends();
    } catch (err) {
      console.error('Error accepting request:', err);
      setError(err.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleDeclineRequest = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/users/friends/decline/${friendId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadFriends();
    } catch (err) {
      console.error('Error declining request:', err);
      setError(err.response?.data?.message || 'Failed to decline request');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/users/friends/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadFriends();
      if (activeTab === 'search') {
        await searchUsers();
      }
    } catch (err) {
      console.error('Error removing friend:', err);
      setError(err.response?.data?.message || 'Failed to remove friend');
    }
  };

  const getImageSrc = (profilePicture) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith('http')) return profilePicture;
    return profilePicture;
  };

  const renderUserCard = (userProfile, showAddButton = false, isRequest = false) => {
    const isFriend = friends.some(f => f._id === userProfile._id);
    const isRequestSent = sentRequests.some(r => r._id === userProfile._id);

    return (
      <div
        key={userProfile._id}
        className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-2 border-purple-400/30 p-4 sm:p-6 rounded-xl hover:border-purple-400/60 transition-all"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar and Info Row */}
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            {/* Avatar */}
            <button
              onClick={() => navigate(`/user/${userProfile._id}`)}
              className="flex-shrink-0 hover:scale-105 transition-transform"
            >
              {getImageSrc(userProfile.profilePicture) ? (
                <img
                  src={getImageSrc(userProfile.profilePicture)}
                  alt={userProfile.username}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-purple-400/50"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center border-2 border-purple-400/50 ${getImageSrc(userProfile.profilePicture) ? 'hidden' : ''}`}
              >
                <FaUser className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </button>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <button
                onClick={() => navigate(`/user/${userProfile._id}`)}
                className="font-bold text-white text-base sm:text-lg hover:text-purple-300 transition-colors text-left truncate block w-full"
              >
                {userProfile.username}
              </button>
              <div className="text-xs sm:text-sm text-gray-400 truncate">{userProfile.email}</div>
              {userProfile.bio && (
                <p className="text-xs sm:text-sm text-white/70 mt-1 line-clamp-2 hidden sm:block">{userProfile.bio}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full sm:w-auto sm:flex-shrink-0">
            {isRequest ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleAcceptRequest(userProfile._id)}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDeclineRequest(userProfile._id)}
                  className="flex-1 sm:flex-none bg-black/40 border-2 border-red-500/50 text-white hover:bg-red-900/40 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
                >
                  Decline
                </button>
              </div>
            ) : showAddButton && (
              isFriend ? (
                <button
                  onClick={() => handleRemoveFriend(userProfile._id)}
                  className="w-full sm:w-auto bg-black/40 border-2 border-red-500/50 text-white hover:bg-red-900/40 px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <FaUserMinus className="w-4 h-4" />
                  <span>Remove</span>
                </button>
              ) : isRequestSent ? (
                <button
                  className="w-full sm:w-auto bg-black/40 border-2 border-gray-500/50 text-white hover:bg-gray-900/40 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
                  disabled
                >
                  Request Sent
                </button>
              ) : (
                <button
                  onClick={() => handleSendRequest(userProfile._id)}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <FaUserPlus className="w-4 h-4" />
                  <span>Add Friend</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 py-8 sm:py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 sm:mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-center">
          Social
        </h1>

        {error && (
          <div className="mb-4 bg-red-900/40 border-2 border-red-500/50 text-white p-4 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="hover:text-red-300">
              <FaTimes />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-1 sm:gap-2 bg-black/60 border-2 border-purple-500/30 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('friends')}
              className={`px-2 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base ${
                activeTab === 'friends'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-white hover:bg-purple-600/20'
              }`}
            >
              <FaUsers className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Friends</span>
              <span className="sm:hidden">Friends</span>
              <span className="text-xs opacity-80">({friends.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-2 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base relative ${
                activeTab === 'requests'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-white hover:bg-purple-600/20'
              }`}
            >
              <FaUserPlus className="w-4 h-4 sm:w-4 sm:h-4" />
              <span>Requests</span>
              {receivedRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 sm:static bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {receivedRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-2 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base ${
                activeTab === 'search'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-white hover:bg-purple-600/20'
              }`}
            >
              <FaSearch className="w-4 h-4 sm:w-4 sm:h-4" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="space-y-4">
            {friends.length === 0 ? (
              <div className="bg-black/60 border-2 border-purple-500/30 p-12 rounded-xl text-center">
                <FaUsers className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No friends yet</h3>
                <p className="text-white/70 mb-6">Start building your gaming network!</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Find People
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {friends.map((friend) => renderUserCard(friend, false))}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Received Requests */}
            {receivedRequests.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FaUserPlus className="w-5 h-5 text-purple-400" />
                  Friend Requests ({receivedRequests.length})
                </h3>
                <div className="space-y-4">
                  {receivedRequests.map((userProfile) => renderUserCard(userProfile, false, true))}
                </div>
              </div>
            )}

            {/* Sent Requests */}
            {sentRequests.length > 0 && (
              <div className={receivedRequests.length > 0 ? 'mt-8' : ''}>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FaUsers className="w-5 h-5 text-cyan-400" />
                  Pending Requests ({sentRequests.length})
                </h3>
                <div className="space-y-4">
                  {sentRequests.map((userProfile) => (
                    <div
                      key={userProfile._id}
                      className="bg-gradient-to-br from-gray-900/40 to-gray-800/40 border-2 border-gray-500/30 p-6 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => navigate(`/user/${userProfile._id}`)}
                          className="flex-shrink-0 hover:scale-105 transition-transform"
                        >
                          {getImageSrc(userProfile.profilePicture) ? (
                            <img
                              src={getImageSrc(userProfile.profilePicture)}
                              alt={userProfile.username}
                              className="w-16 h-16 rounded-full object-cover border-2 border-gray-400/50"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center border-2 border-gray-400/50">
                              <FaUser className="w-8 h-8 text-white" />
                            </div>
                          )}
                        </button>
                        <div className="flex-1">
                          <button
                            onClick={() => navigate(`/user/${userProfile._id}`)}
                            className="font-bold text-white text-lg hover:text-gray-300 transition-colors"
                          >
                            {userProfile.username}
                          </button>
                          <div className="text-sm text-gray-400">{userProfile.email}</div>
                        </div>
                        <div className="text-sm text-gray-400 flex-shrink-0">
                          Waiting for response...
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {receivedRequests.length === 0 && sentRequests.length === 0 && (
              <div className="bg-black/60 border-2 border-purple-500/30 p-12 rounded-xl text-center">
                <FaUserPlus className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No pending requests</h3>
                <p className="text-white/70">When someone sends you a friend request, it will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-black/60 border-2 border-purple-500/30 p-6 rounded-xl">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for gamers by name or email..."
                  className="bg-black/40 border-2 border-purple-400/30 text-white pl-12 py-6 text-lg rounded-lg w-full focus:outline-none focus:border-purple-500"
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Type at least 2 characters to search
              </p>
            </div>

            {isSearching && (
              <div className="text-center py-8 text-white">
                <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Searching...
              </div>
            )}

            {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="bg-black/60 border-2 border-purple-500/30 p-12 rounded-xl text-center">
                <p className="text-white/70">No users found matching "{searchQuery}"</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-4">
                {searchResults.map((userProfile) => renderUserCard(userProfile, true))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Social;

