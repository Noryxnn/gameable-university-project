import axios from "axios";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaGamepad } from "react-icons/fa";

const Register = ({ setUser }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Only send username, email, and password to backend
      const { confirmPassword, ...registerData } = formData;
      const res = await axios.post("/api/users/register", registerData);
      localStorage.setItem("token", res.data.token);
      console.log(res.data);
      setUser(res.data);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-950 via-purple-900 to-purple-950 px-4 py-8">
      <div className="bg-purple-800/30 backdrop-blur-sm p-8 rounded-lg shadow-lg w-full max-w-md border border-purple-700">
        <div className="flex items-center justify-center gap-3 mb-6">
          <FaGamepad className="text-4xl text-purple-400" />
          <h2 className="text-3xl font-bold text-white">
            <span className="bg-gradient-to-r from-pink-400 to-pink-500 bg-clip-text text-transparent">Game</span>
            <span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">Able</span>
          </h2>
        </div>
        {error && <p className="text-red-400 mb-4 text-sm bg-red-500/20 p-2 rounded">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-purple-200 text-sm font-medium mb-1">
              Username
            </label>
            <input
              className="w-full p-3 bg-purple-900/50 border border-purple-700 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none focus:border-purple-500"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              autoComplete="off"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-purple-200 text-sm font-medium mb-1">
              Email
            </label>
            <input
              className="w-full p-3 bg-purple-900/50 border border-purple-700 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none focus:border-purple-500"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="off"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-purple-200 text-sm font-medium mb-1">
              Password
            </label>
            <input
              className="w-full p-3 bg-purple-900/50 border border-purple-700 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none focus:border-purple-500"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-purple-200 text-sm font-medium mb-1">
              Confirm Password
            </label>
            <input
              className="w-full p-3 bg-purple-900/50 border border-purple-700 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none focus:border-purple-500"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>
          <button className="w-full bg-pink-500 hover:bg-pink-600 text-white p-3 rounded-md font-medium cursor-pointer transition-colors">
            Register
          </button>
        </form>
        
        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-purple-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-purple-800/30 text-purple-300">Or continue with</span>
          </div>
        </div>

        {/* Google Sign Up Button */}
        <button
          onClick={() => {
            window.location.href = "/api/users/auth/google";
          }}
          className="w-full bg-white hover:bg-gray-100 text-gray-700 p-3 rounded-md font-medium cursor-pointer transition-colors flex items-center justify-center gap-2 border border-gray-300"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="mt-6 text-center">
          <p className="text-purple-200 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-pink-400 hover:text-pink-300 font-medium underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;