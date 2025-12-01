import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import Fuse from "fuse.js";

const DEBOUNCE_DELAY_MS = 300;

const useGameSearch = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false); // Error state for API failures
  const [searchQuery, setSearchQuery] = useState(""); // Live typing value (for suggestions)
  const [activeSearch, setActiveSearch] = useState(""); // Committed search (for filtering games)
  const [suggestions, setSuggestions] = useState([]);
  const debounceTimerRef = useRef(null);

  // Fetch all games on mount
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await axios.get("/api/games");
        setGames(res.data || []);
      } catch (err) {
        console.error("Error fetching games:", err);
        setError(true);
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

  // Perform fuzzy search and update suggestions (debounced)
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If empty query, clear suggestions immediately (no delay needed)
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    // Set up debounced search
    debounceTimerRef.current = setTimeout(() => {
      const results = fuse.search(searchQuery);
      // Get top 6 suggestions with their match info
      const topSuggestions = results.slice(0, 6).map((result) => ({
        ...result.item,
        score: result.score,
        matchedField: result.matches?.[0]?.key || "title",
      }));
      setSuggestions(topSuggestions);
    }, DEBOUNCE_DELAY_MS);

    // Cleanup: clear timer on unmount or when dependencies change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, fuse]);

  // Get filtered games based on COMMITTED search (activeSearch), not live typing
  const filteredGames = useMemo(() => {
    if (!activeSearch.trim()) {
      return games;
    }
    const results = fuse.search(activeSearch);
    return results.map((result) => result.item);
  }, [activeSearch, games, fuse]);

  // Commit the search (called when user presses Enter)
  const commitSearch = () => {
    setActiveSearch(searchQuery);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
    setSuggestions([]);
  };

  return {
    games,
    filteredGames,
    loading,
    error, // Error state for API failures
    searchQuery,
    setSearchQuery,
    activeSearch, // The committed search term (for display purposes)
    commitSearch, // Function to commit the search
    suggestions,
    clearSearch,
  };
};

export default useGameSearch;
