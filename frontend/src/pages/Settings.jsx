import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaCog } from "react-icons/fa";

const Settings = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
            <FaCog className="text-purple-400" />
            Settings
          </h1>
          <p className="text-gray-400 mt-2">Manage your account and accessibility preferences</p>
        </div>

        {/* Profile Box */}
        <div className="bg-black/60 backdrop-blur-xl border-2 border-purple-500/50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center border-4 border-purple-400/50">
                <span className="text-white text-2xl font-bold">
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{user?.username || "User"}</h2>
                <p className="text-gray-400">{user?.email || ""}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <FaUser className="w-5 h-5" />
              Account
            </button>
          </div>
        </div>

        {/* Accessibility Features Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Accessibility Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Color Blind Mode */}
            <div className="bg-black/60 backdrop-blur-xl border-2 border-purple-500/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-2">Color Blind Mode</h3>
            </div>

            {/* Text-to-Speech */}
            <div className="bg-black/60 backdrop-blur-xl border-2 border-purple-500/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-2">Text-to-Speech</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

