import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import Fuse from "fuse.js";

// Search configuration constants
const DEBOUNCE_DELAY_MS = 300;
const MAX_SUGGESTIONS = 6;
const FUSE_CONFIG = {
  TITLE_WEIGHT: 0.7,
  DEVELOPER_WEIGHT: 0.3,
  THRESHOLD: 0.4,        // Lower = stricter matching, higher = more fuzzy
  DISTANCE: 100,
  MIN_MATCH_LENGTH: 1,
};

const useGameSearch = () => {
  const [games, setGames] = useState([]);
  const [allGames, setAllGames] = useState([]); // All games for search suggestions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false); // Error state for API failures
  const [searchQuery, setSearchQuery] = useState(""); // Live typing value (for suggestions)
  const [activeSearch, setActiveSearch] = useState(""); // Committed search (for filtering games)
  const [suggestions, setSuggestions] = useState([]);
  const debounceTimerRef = useRef(null);

  // Fetch games with optional filters
  const fetchGames = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(false);
      
      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.genres && filters.genres.length > 0) {
        params.append('genres', filters.genres.join(','));
      }
      if (filters.accessibility && filters.accessibility.length > 0) {
        params.append('accessibility', filters.accessibility.join(','));
      }

      const url = `/api/games${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await axios.get(url);
      setGames(res.data || []);
    } catch (err) {
      console.error("Error fetching games:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all games for search suggestions (unfiltered)
  const fetchAllGames = async () => {
    try {
      const res = await axios.get("/api/games");
      setAllGames(res.data || []);
    } catch (err) {
      console.error("Error fetching all games for search:", err);
    }
  };

  // Fetch all games on mount (for search suggestions)
  useEffect(() => {
    fetchAllGames();
    fetchGames(); // Also fetch filtered games (initially empty filters = all games)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Configure Fuse.js for fuzzy search (use allGames for suggestions)
  const fuse = useMemo(() => {
    return new Fuse(allGames, {
      keys: [
        { name: "title", weight: FUSE_CONFIG.TITLE_WEIGHT },
        { name: "developer", weight: FUSE_CONFIG.DEVELOPER_WEIGHT },
      ],
      threshold: FUSE_CONFIG.THRESHOLD,
      distance: FUSE_CONFIG.DISTANCE,
      includeScore: true,
      minMatchCharLength: FUSE_CONFIG.MIN_MATCH_LENGTH,
    });
  }, [allGames]);

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
      // Get top suggestions with their match info
      const topSuggestions = results.slice(0, MAX_SUGGESTIONS).map((result) => ({
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
  // Search is performed on allGames (all games) since genre/accessibility filters are applied client-side
  const filteredGames = useMemo(() => {
    if (!activeSearch.trim()) {
      return games;
    }
    // Create a Fuse instance for all games (search should work on all games)
    const gamesFuse = new Fuse(allGames, {
      keys: [
        { name: "title", weight: FUSE_CONFIG.TITLE_WEIGHT },
        { name: "developer", weight: FUSE_CONFIG.DEVELOPER_WEIGHT },
      ],
      threshold: FUSE_CONFIG.THRESHOLD,
      distance: FUSE_CONFIG.DISTANCE,
      includeScore: true,
      minMatchCharLength: FUSE_CONFIG.MIN_MATCH_LENGTH,
    });
    const results = gamesFuse.search(activeSearch);
    return results.map((result) => result.item);
  }, [activeSearch, allGames, games]);

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
    allGames, // All games (unfiltered) for deriving filter options
    filteredGames,
    loading,
    error, // Error state for API failures
    searchQuery,
    setSearchQuery,
    activeSearch, // The committed search term (for display purposes)
    commitSearch, // Function to commit the search
    suggestions,
    clearSearch,
    refreshGames: fetchGames, // Function to refresh games list
    fetchGamesWithFilters: fetchGames, // Function to fetch games with filters
  };
};

export default useGameSearch;
