import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Social from "./pages/Social";
import UserProfile from "./pages/UserProfile";
import GameDetail from "./pages/GameDetail";
import { useEffect, useState } from "react";
import axios from "axios";
import NotFound from "./components/NotFound";

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const res = await axios.get("/api/users/me", {
              headers: { Authorization: `Bearer ${token}` },
            });
            setUser(res.data);
          } catch (err) {
            // Silently fail if backend is not available or token is invalid
            console.error("Error fetching user:", err);
            localStorage.removeItem("token");
          }
        }
      } catch (err) {
        console.error("Error in fetchUser:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home user={user} error={error} />} />
        <Route path="/game/:id" element={<GameDetail user={user} />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/home" /> : <Login setUser={setUser} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/home" /> : <Register setUser={setUser} />}
        />
        <Route
          path="/profile"
          element={user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />}
        />
        <Route
          path="/social"
          element={user ? <Social user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/user/:userId"
          element={user ? <UserProfile user={user} /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;