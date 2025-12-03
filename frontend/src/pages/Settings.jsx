import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaCog, FaEye, FaVolumeUp } from "react-icons/fa";

const Settings = ({ user }) => {
  const navigate = useNavigate();
  
  // Initialize state directly from localStorage (no useEffect needed)
  const [colorBlindMode, setColorBlindMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("colorBlindMode") || "none";
    }
    return "none";
  });
  
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("textToSpeechEnabled") === "true";
    }
    return false;
  });

  const getImageSrc = (imagePath) => {
    if (!imagePath) return null;
    // If it's a local upload path, use it directly (proxy will handle it)
    if (imagePath.startsWith("/uploads/")) {
      return imagePath;
    }
    // Otherwise, it's a full URL
    return imagePath;
  };

  // Color blindness filters (using SVG filters defined in index.html)
  const colorBlindFilters = {
    none: "none",
    protanopia: "url(#protanopia)",
    deuteranopia: "url(#deuteranopia)",
    tritanopia: "url(#tritanopia)",
  };

  // Apply color blind filter to the entire page
  useEffect(() => {
    const body = document.body;
    const filter = colorBlindFilters[colorBlindMode] || "none";
    
    if (colorBlindMode === "none") {
      body.style.filter = "none";
    } else {
      // Apply filter to body element
      body.style.filter = filter;
    }

    // Store preference
    localStorage.setItem("colorBlindMode", colorBlindMode);
    
    // Dispatch custom event to notify App.jsx of the change
    window.dispatchEvent(new Event("colorBlindModeChanged"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorBlindMode]);

  const handleColorBlindChange = (mode) => {
    setColorBlindMode(mode);
  };

  // Handle text-to-speech toggle
  const handleTextToSpeechToggle = (enabled) => {
    setTextToSpeechEnabled(enabled);
    localStorage.setItem("textToSpeechEnabled", enabled.toString());
    
    // Dispatch custom event to notify App.jsx of the change
    window.dispatchEvent(new CustomEvent("textToSpeechChanged", { detail: { enabled } }));
    
    // If disabling, stop any ongoing speech
    if (!enabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // No need for useEffect to load from localStorage - state is initialized directly

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
              <div className="relative">
                {getImageSrc(user?.profilePicture) ? (
                  <img
                    src={getImageSrc(user.profilePicture)}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-4 border-purple-400/50"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className={`w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center border-4 border-purple-400/50 ${
                    getImageSrc(user?.profilePicture) ? "hidden" : ""
                  }`}
                >
                  <span className="text-white text-2xl font-bold">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
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
              <div className="flex items-center gap-3 mb-4">
                <FaEye className="text-purple-400 text-xl" />
                <h3 className="text-xl font-bold text-white">Color Blind Mode</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Adjust the website colors to better suit your color vision needs
              </p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="colorBlindMode"
                    value="none"
                    checked={colorBlindMode === "none"}
                    onChange={(e) => handleColorBlindChange(e.target.value)}
                    className="w-4 h-4 text-purple-600 bg-black/40 border-purple-500/50 focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-white group-hover:text-purple-300 transition-colors">
                    None (Normal)
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="colorBlindMode"
                    value="protanopia"
                    checked={colorBlindMode === "protanopia"}
                    onChange={(e) => handleColorBlindChange(e.target.value)}
                    className="w-4 h-4 text-purple-600 bg-black/40 border-purple-500/50 focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-white group-hover:text-purple-300 transition-colors">
                    Protanopia (Red-blind)
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="colorBlindMode"
                    value="deuteranopia"
                    checked={colorBlindMode === "deuteranopia"}
                    onChange={(e) => handleColorBlindChange(e.target.value)}
                    className="w-4 h-4 text-purple-600 bg-black/40 border-purple-500/50 focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-white group-hover:text-purple-300 transition-colors">
                    Deuteranopia (Green-blind)
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="colorBlindMode"
                    value="tritanopia"
                    checked={colorBlindMode === "tritanopia"}
                    onChange={(e) => handleColorBlindChange(e.target.value)}
                    className="w-4 h-4 text-purple-600 bg-black/40 border-purple-500/50 focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-white group-hover:text-purple-300 transition-colors">
                    Tritanopia (Blue-blind)
                  </span>
                </label>
              </div>
            </div>

            {/* Text-to-Speech */}
            <div className="bg-black/60 backdrop-blur-xl border-2 border-purple-500/50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaVolumeUp className="text-purple-400 text-xl" />
                <h3 className="text-xl font-bold text-white">Text-to-Speech</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Enable text-to-speech to have text read aloud when you click on it
              </p>
              <div className="flex items-center justify-between">
                <span className="text-white">
                  {textToSpeechEnabled ? "Enabled" : "Disabled"}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={textToSpeechEnabled}
                    onChange={(e) => handleTextToSpeechToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              {textToSpeechEnabled && (
                <div className="mt-4 p-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                  <p className="text-purple-300 text-sm">
                    💡 Tip: Click on any text element to have it read aloud
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

