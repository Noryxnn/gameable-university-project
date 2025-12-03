import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FaGamepad } from "react-icons/fa";

const GoogleCallback = ({ setUser }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get token from URL query parameters
        const token = searchParams.get("token");
        const errorParam = searchParams.get("error");

        // Check for error from backend
        if (errorParam) {
          let errorMessage = "Authentication failed";
          if (errorParam === "google_auth_failed") {
            errorMessage = "Google authentication failed. Please try again.";
          } else if (errorParam === "google_oauth_not_configured") {
            errorMessage = "Google OAuth is not configured on the server. Please use email/password login.";
          } else if (errorParam === "account_banned") {
            errorMessage = "Your account has been banned. Please contact support.";
          } else if (errorParam === "server_error") {
            errorMessage = "Server error. Please try again later.";
          }
          setError(errorMessage);
          setLoading(false);
          setTimeout(() => {
            navigate("/login");
          }, 3000);
          return;
        }

        // Check if token exists
        if (!token) {
          setError("No authentication token received. Please try again.");
          setLoading(false);
          setTimeout(() => {
            navigate("/login");
          }, 3000);
          return;
        }

        // Store token in localStorage
        localStorage.setItem("token", token);

        // Fetch user data
        try {
          const res = await axios.get("/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });

          // Check if user is banned
          if (res.data.isBanned) {
            localStorage.removeItem("token");
            setError("Your account has been banned. Please contact support.");
            setLoading(false);
            setTimeout(() => {
              navigate("/login");
            }, 3000);
            return;
          }

          // Update user state
          setUser(res.data);

          // Redirect to home
          navigate("/home");
        } catch (err) {
          console.error("Error fetching user:", err);
          localStorage.removeItem("token");
          setError("Failed to fetch user data. Please try again.");
          setLoading(false);
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        }
      } catch (err) {
        console.error("Callback error:", err);
        setError("An error occurred. Please try again.");
        setLoading(false);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-950 via-purple-900 to-purple-950 px-4">
      <div className="bg-purple-800/30 backdrop-blur-sm p-8 rounded-lg shadow-lg w-full max-w-md border border-purple-700 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <FaGamepad className="text-4xl text-purple-400" />
          <h2 className="text-3xl font-bold text-white">
            <span className="bg-gradient-to-r from-pink-400 to-pink-500 bg-clip-text text-transparent">Game</span>
            <span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">Able</span>
          </h2>
        </div>
        
        {loading && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-purple-200">Completing authentication...</p>
          </div>
        )}
        
        {error && (
          <div>
            <p className="text-red-400 mb-4 text-sm bg-red-500/20 p-4 rounded">{error}</p>
            <p className="text-purple-300 text-sm">Redirecting to login page...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;

