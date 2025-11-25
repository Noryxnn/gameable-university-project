import axios from "axios";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

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
        <h2 className="text-3xl font-bold mb-6 text-center text-white">
          Register
        </h2>
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