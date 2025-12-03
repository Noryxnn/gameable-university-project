/* eslint-disable react-hooks/set-state-in-effect -- Initialization state updates are intentional and only run once */
import { useState, useEffect, useCallback, useRef } from 'react';

// Check for browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Parse voice input into structured commands - defined outside hook to avoid hoisting issues
const parseCommand = (text) => {
  const lowerText = text.toLowerCase().trim();
  
  // Navigation commands
  if (lowerText.match(/^(go to |navigate to |open )?(home|main|browse)/)) {
    return { type: 'navigate', target: 'home' };
  }
  if (lowerText.match(/^(go to |navigate to |open )?profile/)) {
    return { type: 'navigate', target: 'profile' };
  }
  if (lowerText.match(/^(go to |navigate to |open )?(favorites?|saved|liked)/)) {
    return { type: 'navigate', target: 'favorites' };
  }
  if (lowerText.match(/^(go to |navigate to |open )?social/)) {
    return { type: 'navigate', target: 'social' };
  }
  if (lowerText.match(/^(go to |navigate to |open )?request( game)?/)) {
    return { type: 'navigate', target: 'request-game' };
  }
  if (lowerText.match(/^(go to |navigate to |open )?login/)) {
    return { type: 'navigate', target: 'login' };
  }
  if (lowerText.match(/^(go to |navigate to |open )?register|sign up/)) {
    return { type: 'navigate', target: 'register' };
  }
  if (lowerText.match(/^(go )?back/)) {
    return { type: 'navigate', target: 'back' };
  }
  if (lowerText.match(/^log ?out|sign ?out/)) {
    return { type: 'action', action: 'logout' };
  }

  // Search commands (longer patterns first to avoid partial matches)
  const searchMatch = lowerText.match(/^(search for|look for|look up|search|find) (.+)/);
  if (searchMatch) {
    return { type: 'search', query: searchMatch[2] };
  }

  // Clear search
  if (lowerText.match(/^(clear|reset|remove) search/)) {
    return { type: 'action', action: 'clearSearch' };
  }

  // Filter commands - Genre
  const genreMatch = lowerText.match(/^(filter|show|display) (by )?(.+?) games?$/);
  if (genreMatch) {
    return { type: 'filter', filterType: 'genre', value: genreMatch[3] };
  }
  
  const filterGenreMatch = lowerText.match(/^(filter|show) (by )?genre (.+)/);
  if (filterGenreMatch) {
    return { type: 'filter', filterType: 'genre', value: filterGenreMatch[3] };
  }

  // Filter commands - Accessibility
  const accessibilityMatch = lowerText.match(/^(filter|show) (by )?(accessibility|accessible) (.+)/);
  if (accessibilityMatch) {
    return { type: 'filter', filterType: 'accessibility', value: accessibilityMatch[4] };
  }

  // Filter commands - ESRB Rating
  if (lowerText.match(/^(filter|show) (by )?(everyone|rated e$|e rated)/)) {
    return { type: 'filter', filterType: 'rating', value: 'everyone' };
  }
  if (lowerText.match(/^(filter|show) (by )?(everyone 10|rated e10|e10|e 10)/)) {
    return { type: 'filter', filterType: 'rating', value: 'everyone 10' };
  }
  if (lowerText.match(/^(filter|show) (by )?(teen|rated t$|t rated)/)) {
    return { type: 'filter', filterType: 'rating', value: 'teen' };
  }
  if (lowerText.match(/^(filter|show) (by )?(mature|rated m$|m rated)/)) {
    return { type: 'filter', filterType: 'rating', value: 'mature' };
  }
  if (lowerText.match(/^(filter|show) all ratings?/)) {
    return { type: 'filter', filterType: 'rating', value: 'all' };
  }

  // Clear filters
  if (lowerText.match(/^(clear|reset|remove) (all )?(filters?)/)) {
    return { type: 'action', action: 'clearFilters' };
  }

  // Sort commands
  if (lowerText.match(/^sort (by )?(rating|score|best)/)) {
    return { type: 'sort', sortBy: 'rating' };
  }
  if (lowerText.match(/^sort (by )?(newest|recent|new|date)/)) {
    return { type: 'sort', sortBy: 'newest' };
  }
  if (lowerText.match(/^sort (by )?(oldest|old)/)) {
    return { type: 'sort', sortBy: 'oldest' };
  }
  if (lowerText.match(/^sort (by )?(name|title|alphabetical|a to z)/)) {
    return { type: 'sort', sortBy: 'name' };
  }
  if (lowerText.match(/^(sort )?default|reset sort/)) {
    return { type: 'sort', sortBy: 'default' };
  }

  // Rating commands (for reviews)
  const ratingMatch = lowerText.match(/^(rate|give|set) (\d|one|two|three|four|five) stars?/);
  if (ratingMatch) {
    let rating = ratingMatch[2];
    // Convert word to number
    const wordToNum = { one: 1, two: 2, three: 3, four: 4, five: 5 };
    if (wordToNum[rating]) {
      rating = wordToNum[rating];
    } else {
      rating = parseInt(rating);
    }
    if (rating >= 1 && rating <= 5) {
      return { type: 'rate', rating };
    }
  }

  // Review commands
  const reviewMatch = lowerText.match(/^(write|submit|post|add) review (.+)/);
  if (reviewMatch) {
    return { type: 'review', content: reviewMatch[2] };
  }
  
  if (lowerText.match(/^submit review$/)) {
    return { type: 'action', action: 'submitReview' };
  }

  // Favorite commands
  if (lowerText.match(/^(add to |save (to )?|)(favorites?|saved)/)) {
    return { type: 'action', action: 'addFavorite' };
  }
  if (lowerText.match(/^(remove (from )?|unsave |delete (from )?)(favorites?|saved)/)) {
    return { type: 'action', action: 'removeFavorite' };
  }
  if (lowerText.match(/^(toggle )?favorite/)) {
    return { type: 'action', action: 'toggleFavorite' };
  }

  // Scroll commands
  if (lowerText.match(/^scroll (to )?(top|up)/)) {
    return { type: 'scroll', direction: 'top' };
  }
  if (lowerText.match(/^scroll (to )?(bottom|down)/)) {
    return { type: 'scroll', direction: 'bottom' };
  }

  // Help command
  if (lowerText.match(/^(help|commands|what can (i|you) (say|do))/)) {
    return { type: 'action', action: 'showHelp' };
  }

  // Stop listening
  if (lowerText.match(/^(stop|cancel|close|nevermind|never mind)/)) {
    return { type: 'action', action: 'stop' };
  }

  // Open first/specific game by index
  const openGameIndexMatch = lowerText.match(/^open (game )?(number )?(\d+|first|second|third)$/);
  if (openGameIndexMatch) {
    let num = openGameIndexMatch[3];
    const wordToNum = { first: 1, second: 2, third: 3 };
    if (wordToNum[num]) {
      num = wordToNum[num];
    } else {
      num = parseInt(num);
    }
    return { type: 'action', action: 'openGame', gameIndex: num };
  }

  // Open specific game by name (e.g., "open cyberpunk 2077", "open the witcher")
  const openGameNameMatch = lowerText.match(/^(open|play|view|show me|go to) (.+)/);
  if (openGameNameMatch) {
    const gameName = openGameNameMatch[2].trim();
    // Exclude navigation keywords to avoid conflicts
    const navigationKeywords = ['home', 'profile', 'favorites', 'saved', 'social', 'login', 'register', 'request', 'back'];
    if (!navigationKeywords.some(keyword => gameName === keyword || gameName.startsWith(keyword + ' '))) {
      return { type: 'openGameByName', gameName };
    }
  }

  // If no command matched, return raw text
  return { type: 'unknown', text: lowerText };
};

const useVoiceCommands = (options = {}) => {
  const {
    onCommand,
    onResult,
    onError,
    continuous = false,
    language = 'en-US',
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  // Initialize speech recognition
  useEffect(() => {
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser');
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition();
    
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      setError(null);
      setTranscript('');
      setInterimTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
      isListeningRef.current = false;
      setInterimTranscript('');
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(event.error);
      setIsListening(false);
      isListeningRef.current = false;
      
      if (onError) {
        onError(event.error);
      }
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        setInterimTranscript('');
        
        if (onResult) {
          onResult(finalTranscript);
        }
        
        if (onCommand) {
          const command = parseCommand(finalTranscript);
          if (command) {
            onCommand(command);
          }
        }
      } else {
        setInterimTranscript(interim);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [continuous, language, onCommand, onResult, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) return;
    
    try {
      setError(null);
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError(err.message);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListeningRef.current) return;
    
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
};

export default useVoiceCommands;

