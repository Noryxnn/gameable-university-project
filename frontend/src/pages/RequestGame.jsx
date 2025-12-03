import React, { useState } from "react";
import axios from "axios";
import { FaGamepad, FaLink, FaSteam, FaXbox, FaPlaystation, FaGlobe, FaDeaf, FaHandPaper, FaEye, FaBrain, FaCogs, FaUniversalAccess } from "react-icons/fa";
import { SiEpicgames, SiActivision } from "react-icons/si";

const RequestGame = ({ user }) => {
  const [formData, setFormData] = useState({
    gameTitle: "",
    gameLink: "",
  });
  const [accessibilityFeatures, setAccessibilityFeatures] = useState({
    hearing: false,
    motor: false,
    vision: false,
    cognitive: false,
    general: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleAccessibility = (feature) => {
    setAccessibilityFeatures((prev) => ({
      ...prev,
      [feature]: !prev[feature],
    }));
    setError("");
    setSuccess("");
  };

  const hasAnyAccessibility = () => {
    return Object.values(accessibilityFeatures).some((v) => v);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const validateLink = (url) => {
    try {
      const urlObj = new URL(url);
      
      // Must be http or https
      if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
        return false;
      }

      const hostname = urlObj.hostname.toLowerCase().replace("www.", "");
      const pathname = urlObj.pathname.toLowerCase();
      const search = urlObj.search.toLowerCase();

      // Reject search pages
      if (search.includes("search=") || search.includes("q=") || pathname.includes("/search")) {
        return false;
      }

      // BLOCKED DOMAINS (strict)
      const blockedDomains = [
        // Search engines
        "google", "bing", "yahoo", "duckduckgo", "baidu", "yandex",
        // Wikipedia / Fandom
        "wikipedia.org", "wikimedia.org", "fandom.com", "wikia.com",
        // News sites
        "bbc.com", "bbc.co.uk", "theverge.com", "theguardian.com", "nytimes.com",
        "engadget.com", "techradar.com", "cnet.com", "forbes.com", "cnn.com",
        "washingtonpost.com", "kotaku.com", "arstechnica.com",
        // Video platforms
        "youtube.com", "youtu.be", "twitch.tv", "vimeo.com", "dailymotion.com",
        // Review sites
        "ign.com", "gamespot.com", "polygon.com", "pcgamer.com", "metacritic.com",
        "opencritic.com", "eurogamer.net", "destructoid.com", "gamesradar.com",
        "pushsquare.com", "nintendolife.com", "rockpapershotgun.com",
        // Social media
        "facebook.com", "fb.com", "twitter.com", "instagram.com", "tiktok.com",
        "reddit.com", "linkedin.com", "pinterest.com", "tumblr.com", "snapchat.com",
        "threads.net", "discord.com", "discord.gg",
        // E-commerce
        "amazon.com", "amazon.co.uk", "amazon.", "ebay.com", "etsy.com", "aliexpress.com",
        // Blogging platforms (blocked)
        "medium.com", "substack.com", "blogger.com", "blogspot.com",
        // Other irrelevant
        "imdb.com", "rottentomatoes.com",
      ];

      // Check if hostname contains any blocked keyword/domain
      const isBlocked = blockedDomains.some((blocked) => hostname.includes(blocked));
      if (isBlocked) return false;

      // ALLOWED GAME STORES - must have proper game path (not just homepage)
      const storePatterns = [
        { domain: "store.steampowered.com", requiredPath: "/app/" },
        { domain: "steampowered.com", requiredPath: "/app/" },
        { domain: "xbox.com", requiredPath: "/games/" },
        { domain: "microsoft.com", requiredPath: "/store/" },
        { domain: "playstation.com", requiredPath: ["/product/", "/games/"] },
        { domain: "store.playstation.com", requiredPath: "/" },
        { domain: "store.epicgames.com", requiredPath: "/p/" },
        { domain: "epicgames.com", requiredPath: "/store/" },
        { domain: "activision.com", requiredPath: "/games/" },
        { domain: "gog.com", requiredPath: "/game/" },
        { domain: "nintendo.com", requiredPath: "/store/" },
      ];

      // Check if it's a known game store
      for (const store of storePatterns) {
        if (hostname === store.domain || hostname.endsWith("." + store.domain)) {
          // It's a known store - check for valid game path
          const requiredPaths = Array.isArray(store.requiredPath) ? store.requiredPath : [store.requiredPath];
          const hasValidPath = requiredPaths.some((p) => pathname.includes(p));
          
          if (!hasValidPath && pathname === "/") {
            return false; // Reject store homepages
          }
          return hasValidPath || pathname.length > 1; // Allow if has game path or non-root path
        }
      }

      // ALLOWED OFFICIAL SITES - indie developers, game websites
      // Allow any non-blocked domain (indie dev sites like hollowknight.com, stardewvalley.net, etc.)
      // Also allow wordpress.com, wixsite.com, weebly.com for indie devs
      // const allowedPlatforms = ["wordpress.com", "wixsite.com", "weebly.com", "wix.com", "carrd.co", "itch.io", "gamejolt.com"];
      
      // If it's not blocked, it's likely an official game site or indie dev site
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.gameTitle.trim()) {
      setError("Please enter a game title");
      return;
    }

    if (!formData.gameLink.trim()) {
      setError("Please enter a game link");
      return;
    }

    if (!validateLink(formData.gameLink)) {
      setError("Please provide a direct link to the game's store page (Steam, Xbox, PlayStation, Epic, GOG) or official game website. Search pages, homepages without a game, social media, YouTube, news, and review sites are not accepted.");
      return;
    }

    if (!hasAnyAccessibility()) {
      setError("Please select at least one accessibility feature. The game must have accessibility options to be added to GameAble.");
      return;
    }

    // Convert accessibility object to array of feature names
    const selectedFeatures = Object.entries(accessibilityFeatures)
      .filter(([, value]) => value)
      .map(([key]) => {
        const featureNames = {
          hearing: "Hearing Accessibility",
          motor: "Dexterity / Motor Accessibility",
          vision: "Vision / Low-Vision Accessibility",
          cognitive: "Cognitive Accessibility",
          general: "General Assistive Features",
        };
        return featureNames[key];
      });

    setIsSubmitting(true);

    try {
      await axios.post("/api/game-requests", {
        gameTitle: formData.gameTitle.trim(),
        gameLink: formData.gameLink.trim(),
        accessibilityFeatures: selectedFeatures,
        userId: user?._id || null,
      });

      setSuccess("Thank you! Your game request has been submitted successfully. We'll review it soon!");
      setFormData({ gameTitle: "", gameLink: "" });
      setAccessibilityFeatures({
        hearing: false,
        motor: false,
        vision: false,
        cognitive: false,
        general: false,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      {/* Hero Section */}
      <div className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-pink-900/30 to-cyan-900/50"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDE2OCw4NSwyNDcsMC4xNSkiLz48L2c+PC9zdmc+')] opacity-40"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
              Request a Game
            </h1>
            <p className="text-lg sm:text-xl text-white/80 leading-relaxed">
              Can't find a game you love? Let us know and we'll work on adding it to{" "}
              <span className="text-pink-400 font-bold">GameAble</span>!
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-2xl mx-auto">
          {/* Info Card */}
          <div className="mb-8 p-6 bg-black/40 border-2 border-purple-500/30 backdrop-blur-xl rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FaLink className="text-cyan-400" />
              Accepted Game Sources
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <FaSteam className="text-white text-lg" />
                <span>Steam</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <FaXbox className="text-green-500 text-lg" />
                <span>Xbox</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <FaPlaystation className="text-blue-500 text-lg" />
                <span>PlayStation</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <SiEpicgames className="text-white text-lg" />
                <span>Epic Games</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <SiActivision className="text-white text-lg" />
                <span>Activision</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <FaGlobe className="text-purple-400 text-lg" />
                <span>Official Sites</span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-black/60 border-2 border-purple-500/40 backdrop-blur-xl shadow-2xl shadow-purple-500/20 rounded-2xl p-8">
            <div className="flex items-center justify-center gap-3 mb-8">
              <FaGamepad className="text-4xl text-purple-400" />
              <h2 className="text-2xl font-bold text-white">
                <span className="bg-gradient-to-r from-pink-400 to-pink-500 bg-clip-text text-transparent">Submit</span>{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">Request</span>
              </h2>
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

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Game Title <span className="text-pink-400">*</span>
                </label>
                <input
                  className="w-full p-4 bg-purple-900/50 border-2 border-purple-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none focus:border-purple-500 transition-all"
                  type="text"
                  name="gameTitle"
                  value={formData.gameTitle}
                  onChange={handleChange}
                  placeholder="e.g., The Last of Us Part II"
                  autoComplete="off"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Game Link <span className="text-pink-400">*</span>
                </label>
                <input
                  className="w-full p-4 bg-purple-900/50 border-2 border-purple-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none focus:border-purple-500 transition-all"
                  type="url"
                  name="gameLink"
                  value={formData.gameLink}
                  onChange={handleChange}
                  placeholder="https://store.steampowered.com/app/..."
                  autoComplete="off"
                  required
                />
                <p className="mt-2 text-purple-400/70 text-xs">
                  Provide a link to the game's store page, official website, or any page with game info.
                </p>
              </div>

              {/* Accessibility Features Checklist */}
              <div className="mb-6">
                <label className="block text-purple-200 text-sm font-medium mb-2 flex items-center gap-2">
                  <FaUniversalAccess className="text-cyan-400 w-4 h-4" />
                  Accessibility Categories <span className="text-pink-400">*</span>
                </label>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAccessibility("hearing")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      accessibilityFeatures.hearing
                        ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300"
                        : "bg-purple-900/40 border border-purple-700 text-white/60 hover:border-cyan-500/50 hover:text-white/80"
                    }`}
                  >
                    <FaDeaf className="w-3.5 h-3.5" />
                    Hearing
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleAccessibility("motor")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      accessibilityFeatures.motor
                        ? "bg-green-500/20 border border-green-400 text-green-300"
                        : "bg-purple-900/40 border border-purple-700 text-white/60 hover:border-green-500/50 hover:text-white/80"
                    }`}
                  >
                    <FaHandPaper className="w-3.5 h-3.5" />
                    Motor
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleAccessibility("vision")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      accessibilityFeatures.vision
                        ? "bg-blue-500/20 border border-blue-400 text-blue-300"
                        : "bg-purple-900/40 border border-purple-700 text-white/60 hover:border-blue-500/50 hover:text-white/80"
                    }`}
                  >
                    <FaEye className="w-3.5 h-3.5" />
                    Vision
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleAccessibility("cognitive")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      accessibilityFeatures.cognitive
                        ? "bg-pink-500/20 border border-pink-400 text-pink-300"
                        : "bg-purple-900/40 border border-purple-700 text-white/60 hover:border-pink-500/50 hover:text-white/80"
                    }`}
                  >
                    <FaBrain className="w-3.5 h-3.5" />
                    Cognitive
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleAccessibility("general")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      accessibilityFeatures.general
                        ? "bg-purple-500/20 border border-purple-400 text-purple-300"
                        : "bg-purple-900/40 border border-purple-700 text-white/60 hover:border-purple-500/50 hover:text-white/80"
                    }`}
                  >
                    <FaCogs className="w-3.5 h-3.5" />
                    General
                  </button>
                </div>

                {!hasAnyAccessibility() && (
                  <p className="mt-2 text-amber-400/70 text-xs">
                    Select at least one category
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 text-white p-4 rounded-xl font-bold cursor-pointer transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-pink-500/40 hover:scale-[1.02] disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit Game Request"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-purple-300/60 text-sm">
                We review all submissions and prioritize games with strong accessibility features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestGame;

