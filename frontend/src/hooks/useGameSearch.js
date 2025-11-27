import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Fuse from "fuse.js";

const useGameSearch = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // Fetch all games on mount
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/games");
        setGames(res.data || []);
      } catch (err) {
        console.error("Error fetching games:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  // Configure Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(games, {
      keys: [
        { name: "title", weight: 0.7 },
        { name: "developer", weight: 0.3 },
      ],
      threshold: 0.4, // Lower = stricter matching, higher = more fuzzy
      distance: 100,
      includeScore: true,
      minMatchCharLength: 1,
    });
  }, [games]);

  // Perform fuzzy search and update suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const results = fuse.search(searchQuery);
    // Get top 6 suggestions with their match info
    const topSuggestions = results.slice(0, 6).map((result) => ({
      ...result.item,
      score: result.score,
      matchedField: result.matches?.[0]?.key || "title",
    }));
    setSuggestions(topSuggestions);
  }, [searchQuery, fuse]);

  // Get filtered games based on current search
  const filteredGames = useMemo(() => {
    if (!searchQuery.trim()) {
      return games;
    }
    const results = fuse.search(searchQuery);
    return results.map((result) => result.item);
  }, [searchQuery, games, fuse]);

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
  };

  return {
    games,
    filteredGames,
    loading,
    searchQuery,
    setSearchQuery,
    suggestions,
    clearSearch,
  };
};

export default useGameSearch;

