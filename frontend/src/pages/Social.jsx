import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaUserPlus, FaUserMinus, FaUser, FaUsers, FaTimes, FaComments, FaPaperPlane, FaArrowLeft, FaCircle } from 'react-icons/fa';

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

  // Chat state
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const messagePollingRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadFriends();
      loadConversations();
      loadUnreadCount();
    }
  }, [user]);

  // Poll for new messages when in chat
  useEffect(() => {
    if (activeTab === 'messages' && activeConversation) {
      // Initial load
      loadMessages(activeConversation._id);
      
      // Poll every 3 seconds for new messages
      messagePollingRef.current = setInterval(() => {
        loadMessages(activeConversation._id, true);
      }, 3000);

      return () => {
        if (messagePollingRef.current) {
          clearInterval(messagePollingRef.current);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeConversation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const loadUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/chat/unread', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTotalUnread(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  };

  const loadMessages = useCallback(async (conversationId, silent = false) => {
    try {
      if (!silent) setLoadingMessages(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/chat/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data || []);
      // Update unread count
      loadUnreadCount();
      loadConversations();
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, []);

  const startConversation = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/chat/conversations/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveConversation(res.data);
      setActiveTab('messages');
      loadMessages(res.data._id);
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError(err.response?.data?.message || 'Failed to start conversation');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || sendingMessage) return;

    try {
      setSendingMessage(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `/api/chat/messages/${activeConversation._id}`,
        { content: newMessage.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
      loadConversations();
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

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

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderUserCard = (userProfile, showAddButton = false, isRequest = false, showMessageButton = false) => {
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
          <div className="w-full sm:w-auto sm:flex-shrink-0 flex flex-col sm:flex-row gap-2">
            {showMessageButton && isFriend && (
              <button
                onClick={() => startConversation(userProfile._id)}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base text-white"
              >
                <FaComments className="w-4 h-4" />
                <span>Message</span>
              </button>
            )}
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

  // Render conversation list
  const renderConversationList = () => (
    <div className="space-y-3">
      {conversations.length === 0 ? (
        <div className="bg-black/60 border-2 border-purple-500/30 p-8 sm:p-12 rounded-xl text-center">
          <FaComments className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-400 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No messages yet</h3>
          <p className="text-white/70 text-sm sm:text-base mb-6">Start chatting with your friends!</p>
          <button
            onClick={() => setActiveTab('friends')}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base"
          >
            View Friends
          </button>
        </div>
      ) : (
        conversations.map(conv => (
          <button
            key={conv._id}
            onClick={() => {
              setActiveConversation(conv);
              loadMessages(conv._id);
            }}
            className={`w-full text-left p-3 sm:p-4 rounded-xl transition-all ${
              activeConversation?._id === conv._id
                ? 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 border-2 border-purple-400'
                : 'bg-black/40 border-2 border-purple-500/30 hover:border-purple-400/60'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {getImageSrc(conv.otherUser?.profilePicture) ? (
                  <img
                    src={getImageSrc(conv.otherUser.profilePicture)}
                    alt={conv.otherUser?.username}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-purple-400/50"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center border-2 border-purple-400/50">
                    <FaUser className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                )}
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-bold">
                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm sm:text-base truncate">
                    {conv.otherUser?.username}
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-400 flex-shrink-0 ml-2">
                    {conv.lastMessage && formatMessageTime(conv.lastMessageAt)}
                  </span>
                </div>
                <p className={`text-xs sm:text-sm truncate ${conv.unreadCount > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>
                  {conv.lastMessage?.content || 'No messages yet'}
                </p>
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );

  // Render chat thread
  const renderChatThread = () => (
    <div className="flex flex-col h-[60vh] sm:h-[65vh] bg-black/40 border-2 border-purple-500/30 rounded-xl overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-3 sm:p-4 border-b border-purple-500/30 bg-black/60">
        <button
          onClick={() => setActiveConversation(null)}
          className="p-2 hover:bg-purple-600/20 rounded-lg transition-colors text-white"
        >
          <FaArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate(`/user/${activeConversation.otherUser?._id}`)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          {getImageSrc(activeConversation.otherUser?.profilePicture) ? (
            <img
              src={getImageSrc(activeConversation.otherUser.profilePicture)}
              alt={activeConversation.otherUser?.username}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-purple-400/50"
            />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center border-2 border-purple-400/50">
              <FaUser className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="font-bold text-white text-sm sm:text-base">
            {activeConversation.otherUser?.username}
          </span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FaComments className="w-12 h-12 text-purple-400/50 mb-3" />
            <p className="text-gray-400 text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.sender._id === user._id;
            const showAvatar = index === 0 || messages[index - 1]?.sender._id !== msg.sender._id;
            
            return (
              <div
                key={msg._id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {!isOwn && showAvatar && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0 mb-1">
                      {getImageSrc(msg.sender.profilePicture) ? (
                        <img
                          src={getImageSrc(msg.sender.profilePicture)}
                          alt={msg.sender.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                          <FaUser className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  )}
                  {!isOwn && !showAvatar && <div className="w-6 sm:w-8 flex-shrink-0" />}
                  <div
                    className={`px-3 sm:px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-md'
                        : 'bg-gray-800 text-white rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm sm:text-base break-words">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/60' : 'text-gray-500'}`}>
                      {formatMessageTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-3 sm:p-4 border-t border-purple-500/30 bg-black/60">
        <div className="flex gap-2 sm:gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-black/40 border-2 border-purple-400/30 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl focus:outline-none focus:border-purple-500 text-sm sm:text-base"
            disabled={sendingMessage}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sendingMessage}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FaPaperPlane className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </div>
  );

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
        <div className="mb-6 sm:mb-8">
          <div className="grid grid-cols-4 gap-1 sm:gap-2 bg-black/60 border-2 border-purple-500/30 rounded-xl p-1">
            <button
              onClick={() => { setActiveTab('friends'); setActiveConversation(null); }}
              className={`px-2 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base ${
                activeTab === 'friends'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-white hover:bg-purple-600/20'
              }`}
            >
              <FaUsers className="w-4 h-4" />
              <span className="hidden sm:inline">Friends</span>
              <span className="sm:hidden text-[10px]">Friends</span>
              <span className="text-[10px] sm:text-xs opacity-80">({friends.length})</span>
            </button>
            <button
              onClick={() => { setActiveTab('messages'); setActiveConversation(null); loadConversations(); }}
              className={`px-2 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base relative ${
                activeTab === 'messages'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                  : 'text-white hover:bg-cyan-600/20'
              }`}
            >
              <FaComments className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
              <span className="sm:hidden text-[10px]">Chat</span>
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 sm:static bg-pink-500 text-white text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-bold">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('requests'); setActiveConversation(null); }}
              className={`px-2 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base relative ${
                activeTab === 'requests'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-white hover:bg-purple-600/20'
              }`}
            >
              <FaUserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Requests</span>
              <span className="sm:hidden text-[10px]">Requests</span>
              {receivedRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 sm:static bg-red-500 text-white text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-bold">
                  {receivedRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('search'); setActiveConversation(null); }}
              className={`px-2 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base ${
                activeTab === 'search'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-white hover:bg-purple-600/20'
              }`}
            >
              <FaSearch className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
              <span className="sm:hidden text-[10px]">Search</span>
            </button>
          </div>
        </div>

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="space-y-4">
            {friends.length === 0 ? (
              <div className="bg-black/60 border-2 border-purple-500/30 p-8 sm:p-12 rounded-xl text-center">
                <FaUsers className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No friends yet</h3>
                <p className="text-white/70 text-sm sm:text-base mb-6">Start building your gaming network!</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base"
                >
                  Find People
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {friends.map((friend) => renderUserCard(friend, false, false, true))}
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div>
            {activeConversation ? renderChatThread() : renderConversationList()}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Received Requests */}
            {receivedRequests.length > 0 && (
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FaUserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
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
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FaUsers className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                  Pending Requests ({sentRequests.length})
                </h3>
                <div className="space-y-4">
                  {sentRequests.map((userProfile) => (
                    <div
                      key={userProfile._id}
                      className="bg-gradient-to-br from-gray-900/40 to-gray-800/40 border-2 border-gray-500/30 p-4 sm:p-6 rounded-xl"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <button
                          onClick={() => navigate(`/user/${userProfile._id}`)}
                          className="flex-shrink-0 hover:scale-105 transition-transform"
                        >
                          {getImageSrc(userProfile.profilePicture) ? (
                            <img
                              src={getImageSrc(userProfile.profilePicture)}
                              alt={userProfile.username}
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gray-400/50"
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center border-2 border-gray-400/50">
                              <FaUser className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                            </div>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => navigate(`/user/${userProfile._id}`)}
                            className="font-bold text-white text-base sm:text-lg hover:text-gray-300 transition-colors truncate block"
                          >
                            {userProfile.username}
                          </button>
                          <div className="text-xs sm:text-sm text-gray-400 truncate">{userProfile.email}</div>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400 flex-shrink-0 hidden sm:block">
                          Waiting for response...
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {receivedRequests.length === 0 && sentRequests.length === 0 && (
              <div className="bg-black/60 border-2 border-purple-500/30 p-8 sm:p-12 rounded-xl text-center">
                <FaUserPlus className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No pending requests</h3>
                <p className="text-white/70 text-sm sm:text-base">When someone sends you a friend request, it will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-black/60 border-2 border-purple-500/30 p-4 sm:p-6 rounded-xl">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for gamers by name or email..."
                  className="bg-black/40 border-2 border-purple-400/30 text-white pl-10 sm:pl-12 py-4 sm:py-6 text-base sm:text-lg rounded-lg w-full focus:outline-none focus:border-purple-500"
                />
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
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
              <div className="bg-black/60 border-2 border-purple-500/30 p-8 sm:p-12 rounded-xl text-center">
                <p className="text-white/70 text-sm sm:text-base">No users found matching "{searchQuery}"</p>
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
