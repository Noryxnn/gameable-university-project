import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useVoiceCommands from '../hooks/useVoiceCommands';
import VoiceCommandButton, { VoiceCommandHelpModal } from '../components/VoiceCommandButton';

const VoiceCommandContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components -- Context hook is commonly exported alongside provider
export const useVoiceContext = () => {
  const context = useContext(VoiceCommandContext);
  if (!context) {
    throw new Error('useVoiceContext must be used within a VoiceCommandProvider');
  }
  return context;
};

export const VoiceCommandProvider = ({ 
  children, 
  user, 
  setUser,
  // Search props
  setSearchQuery,
  clearSearch,
  commitSearch,
  // Filter props  
  setSelectedGenres,
  // eslint-disable-next-line no-unused-vars
  setSelectedAccessibilityFeatures,
  setSelectedRating,
  setSelectedSort,
  handleClearFilters,
  // Game data
  filteredGames,
  allGames,
  availableGenres,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showHelp, setShowHelp] = useState(false);
  const [lastCommand, setLastCommand] = useState(null);
  
  // Page-specific handlers that can be registered by components
  const [pageHandlers, setPageHandlers] = useState({});
  
  // Ref to store stopListening function to avoid circular dependency
  const stopListeningRef = useRef(null);

  // Register a handler for the current page
  const registerHandler = useCallback((handlerName, handler) => {
    setPageHandlers(prev => ({
      ...prev,
      [handlerName]: handler
    }));
  }, []);

  // Unregister a handler
  const unregisterHandler = useCallback((handlerName) => {
    setPageHandlers(prev => {
      const newHandlers = { ...prev };
      delete newHandlers[handlerName];
      return newHandlers;
    });
  }, []);

  // Navigation handler
  const handleNavigation = useCallback((target) => {
    switch (target) {
      case 'home':
        if (clearSearch) clearSearch();
        navigate('/home');
        break;
      case 'profile':
        if (user) {
          navigate('/profile');
        } else {
          navigate('/login');
        }
        break;
      case 'favorites':
        if (user) {
          navigate('/favorites');
        } else {
          navigate('/login');
        }
        break;
      case 'social':
        if (user) {
          navigate('/social');
        } else {
          navigate('/login');
        }
        break;
      case 'request-game':
        if (user) {
          navigate('/request-game');
        } else {
          navigate('/login');
        }
        break;
      case 'login':
        navigate('/login');
        break;
      case 'register':
        navigate('/register');
        break;
      case 'back':
        navigate(-1);
        break;
      default:
        console.log('Unknown navigation target:', target);
    }
  }, [navigate, user, clearSearch]);

  // Search handler
  const handleSearch = useCallback((query) => {
    if (setSearchQuery) {
      setSearchQuery(query);
      if (commitSearch) {
        // Small delay to ensure state is updated
        setTimeout(() => {
          commitSearch();
          if (location.pathname !== '/home') {
            navigate('/home');
          }
        }, 100);
      }
    }
  }, [setSearchQuery, commitSearch, location.pathname, navigate]);

  // Filter handler
  const handleFilter = useCallback((command) => {
    const { filterType, value } = command;
    
    if (filterType === 'genre' && setSelectedGenres && availableGenres) {
      // Find matching genre (case-insensitive)
      const matchingGenre = availableGenres.find(
        g => g.toLowerCase().includes(value.toLowerCase())
      );
      if (matchingGenre) {
        setSelectedGenres(prev => {
          if (prev.includes(matchingGenre)) {
            return prev; // Already selected
          }
          return [...prev, matchingGenre];
        });
      }
    }
    
    // ESRB rating filter (E, E10+, T, M)
    if (filterType === 'rating' && setSelectedRating) {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'all' || lowerValue === 'any') {
        setSelectedRating('all');
      } else if (lowerValue === 'everyone' || lowerValue === 'e') {
        setSelectedRating('E');
      } else if (lowerValue === 'everyone 10' || lowerValue === 'e10' || lowerValue === 'e 10') {
        setSelectedRating('E10+');
      } else if (lowerValue === 'teen' || lowerValue === 't') {
        setSelectedRating('T');
      } else if (lowerValue === 'mature' || lowerValue === 'm') {
        setSelectedRating('M');
      }
    }
    
    // Make sure we're on home page to see filters
    if (location.pathname !== '/home') {
      navigate('/home');
    }
  }, [setSelectedGenres, setSelectedRating, availableGenres, location.pathname, navigate]);

  // Sort handler
  const handleSort = useCallback((sortBy) => {
    if (!setSelectedSort) return;
    
    switch (sortBy) {
      case 'rating':
        setSelectedSort('rating-desc');
        break;
      case 'newest':
        setSelectedSort('releaseYear-desc');
        break;
      case 'oldest':
        setSelectedSort('releaseYear-asc');
        break;
      case 'name':
        setSelectedSort('title-asc');
        break;
      case 'default':
        setSelectedSort('default');
        break;
      default:
        console.log('Unknown sort option:', sortBy);
    }
    
    // Make sure we're on home page to see results
    if (location.pathname !== '/home') {
      navigate('/home');
    }
  }, [setSelectedSort, location.pathname, navigate]);

  // Scroll handler
  const handleScroll = useCallback((direction) => {
    if (direction === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (direction === 'bottom') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  // Open game by name handler
  const handleOpenGameByName = useCallback((gameName) => {
    if (!allGames || allGames.length === 0) {
      console.log('No games available to search');
      return;
    }

    const lowerGameName = gameName.toLowerCase();
    
    // Try to find exact match first
    let matchingGame = allGames.find(
      game => game.title.toLowerCase() === lowerGameName
    );
    
    // If no exact match, try partial match (title contains the search term)
    if (!matchingGame) {
      matchingGame = allGames.find(
        game => game.title.toLowerCase().includes(lowerGameName)
      );
    }
    
    // If still no match, try fuzzy matching (search term contains part of title)
    if (!matchingGame) {
      matchingGame = allGames.find(
        game => lowerGameName.includes(game.title.toLowerCase().split(' ')[0])
      );
    }

    if (matchingGame) {
      navigate(`/game/${matchingGame._id}`);
    } else {
      // If no game found, perform a search instead
      if (setSearchQuery && commitSearch) {
        setSearchQuery(gameName);
        setTimeout(() => {
          commitSearch();
          if (location.pathname !== '/home') {
            navigate('/home');
          }
        }, 100);
      }
    }
  }, [allGames, navigate, setSearchQuery, commitSearch, location.pathname]);

  // Action handler (uses ref for stopListening to avoid circular dependency)
  const handleAction = useCallback((action, command) => {
    switch (action) {
      case 'clearSearch':
        if (clearSearch) clearSearch();
        break;
      
      case 'clearFilters':
        if (handleClearFilters) handleClearFilters();
        break;
      
      case 'addFavorite':
      case 'removeFavorite':
      case 'toggleFavorite':
        if (pageHandlers.toggleFavorite) {
          pageHandlers.toggleFavorite();
        }
        break;
      
      case 'submitReview':
        if (pageHandlers.submitReview) {
          pageHandlers.submitReview();
        }
        break;
      
      case 'showHelp':
        setShowHelp(true);
        break;
      
      case 'logout':
        if (user && setUser) {
          localStorage.removeItem('token');
          setUser(null);
          navigate('/home');
        }
        break;
      
      case 'stop':
        if (stopListeningRef.current) {
          stopListeningRef.current();
        }
        break;
      
      case 'openGame':
        if (filteredGames && command.gameIndex) {
          const gameIndex = command.gameIndex - 1; // Convert to 0-based
          if (gameIndex >= 0 && gameIndex < filteredGames.length) {
            navigate(`/game/${filteredGames[gameIndex]._id}`);
          }
        }
        break;
      
      default:
        console.log('Unknown action:', action);
    }
  }, [clearSearch, handleClearFilters, pageHandlers, user, setUser, navigate, filteredGames]);

  // Handle voice commands - now all handlers are defined above
  const handleCommand = useCallback((command) => {
    console.log('Voice command received:', command);
    setLastCommand(command);

    switch (command.type) {
      case 'navigate':
        handleNavigation(command.target);
        break;
      
      case 'search':
        handleSearch(command.query);
        break;
      
      case 'filter':
        handleFilter(command);
        break;
      
      case 'sort':
        handleSort(command.sortBy);
        break;
      
      case 'rate':
        if (pageHandlers.setRating) {
          pageHandlers.setRating(command.rating);
        }
        break;
      
      case 'review':
        if (pageHandlers.setReviewContent) {
          pageHandlers.setReviewContent(command.content);
        }
        break;
      
      case 'action':
        handleAction(command.action, command);
        break;
      
      case 'scroll':
        handleScroll(command.direction);
        break;
      
      case 'openGameByName':
        handleOpenGameByName(command.gameName);
        break;
      
      default:
        console.log('Unknown command type:', command.type);
    }
  }, [handleNavigation, handleSearch, handleFilter, handleSort, handleAction, handleScroll, handleOpenGameByName, pageHandlers]);

  // Initialize voice commands hook
  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    toggleListening,
  } = useVoiceCommands({
    onCommand: handleCommand,
    continuous: false,
  });

  // Store stopListening in ref for use by handleAction
  // Using useEffect to update ref after render to avoid accessing refs during render
  useEffect(() => {
    stopListeningRef.current = stopListening;
  }, [stopListening]);

  // Speak feedback (text-to-speech)
  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const contextValue = {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    speak,
    registerHandler,
    unregisterHandler,
    showHelp,
    setShowHelp,
  };

  return (
    <VoiceCommandContext.Provider value={contextValue}>
      {children}
      
      {/* Voice Command UI */}
      <VoiceCommandButton
        isListening={isListening}
        isSupported={isSupported}
        transcript={transcript}
        interimTranscript={interimTranscript}
        error={error}
        onToggle={toggleListening}
        onShowHelp={() => setShowHelp(true)}
        lastCommand={lastCommand}
      />
      
      {/* Help Modal */}
      <VoiceCommandHelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </VoiceCommandContext.Provider>
  );
};

export default VoiceCommandContext;
