import axios from "axios";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaGamepad } from "react-icons/fa";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await axios.post("/api/users/forgot-password", { email });
      setSuccess(res.data.message || "If that email exists, a password reset link has been sent");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-950 via-purple-900 to-purple-950 px-4">
      <div className="bg-purple-800/30 backdrop-blur-sm p-8 rounded-lg shadow-lg w-full max-w-md border border-purple-700">
        <div className="flex items-center justify-center gap-3 mb-6">
          <FaGamepad className="text-4xl text-purple-400" />
          <h2 className="text-3xl font-bold text-white">
            <span className="bg-gradient-to-r from-pink-400 to-pink-500 bg-clip-text text-transparent">Game</span>
            <span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">Able</span>
          </h2>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2 text-center">Forgot Password</h3>
        <p className="text-purple-200 text-sm mb-6 text-center">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        {error && <p className="text-red-400 mb-4 text-sm bg-red-500/20 p-2 rounded">{error}</p>}
        {success && <p className="text-green-400 mb-4 text-sm bg-green-500/20 p-2 rounded">{success}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-purple-200 text-sm font-medium mb-1">
              Email
            </label>
            <input
              className="w-full p-3 bg-purple-900/50 border border-purple-700 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none focus:border-purple-500"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="off"
              required
              disabled={isLoading}
            />
          </div>
          <button 
            className="w-full bg-pink-500 hover:bg-pink-600 text-white p-3 rounded-md font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-purple-200 text-sm">
            Remember your password?{" "}
            <Link to="/login" className="text-pink-400 hover:text-pink-300 font-medium underline">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

