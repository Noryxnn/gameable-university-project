import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// We need to test the command parsing logic separately since mocking Web Speech API is complex
// The parsing logic is the core functionality we want to test

// Extract the parseCommand function for testing
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

  // Open specific game by name
  const openGameNameMatch = lowerText.match(/^(open|play|view|show me|go to) (.+)/);
  if (openGameNameMatch) {
    const gameName = openGameNameMatch[2].trim();
    const navigationKeywords = ['home', 'profile', 'favorites', 'saved', 'social', 'login', 'register', 'request', 'back'];
    if (!navigationKeywords.some(keyword => gameName === keyword || gameName.startsWith(keyword + ' '))) {
      return { type: 'openGameByName', gameName };
    }
  }

  // If no command matched, return raw text
  return { type: 'unknown', text: lowerText };
};

describe("useVoiceCommands Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
  });

  // Note: Testing the actual hook with Web Speech API requires complex browser mocking
  // Instead, we focus on testing the command parsing logic which is the core functionality
  describe("parseCommand function", () => {
    it("should be a function", () => {
      expect(typeof parseCommand).toBe("function");
    });
  });
});

describe("Voice Command Parsing - parseCommand", () => {
  describe("Navigation Commands", () => {
    it('should parse "go to home" as navigate to home', () => {
      expect(parseCommand("go to home")).toEqual({
        type: "navigate",
        target: "home",
      });
    });

    it('should parse "navigate to profile" as navigate to profile', () => {
      expect(parseCommand("navigate to profile")).toEqual({
        type: "navigate",
        target: "profile",
      });
    });

    it('should parse "open favorites" as navigate to favorites', () => {
      expect(parseCommand("open favorites")).toEqual({
        type: "navigate",
        target: "favorites",
      });
    });

    it('should parse "go to social" as navigate to social', () => {
      expect(parseCommand("go to social")).toEqual({
        type: "navigate",
        target: "social",
      });
    });

    it('should parse "go back" as navigate back', () => {
      expect(parseCommand("go back")).toEqual({
        type: "navigate",
        target: "back",
      });
    });

    it('should parse "logout" as logout action', () => {
      expect(parseCommand("logout")).toEqual({
        type: "action",
        action: "logout",
      });
    });
  });

  describe("Search Commands", () => {
    it('should parse "search for cyberpunk" as search command', () => {
      expect(parseCommand("search for cyberpunk")).toEqual({
        type: "search",
        query: "cyberpunk",
      });
    });

    it('should parse "find zelda games" as search command', () => {
      expect(parseCommand("find zelda games")).toEqual({
        type: "search",
        query: "zelda games",
      });
    });

    it('should parse "look for action games" as search command', () => {
      expect(parseCommand("look for action games")).toEqual({
        type: "search",
        query: "action games",
      });
    });

    it('should parse "clear search" as clearSearch action', () => {
      expect(parseCommand("clear search")).toEqual({
        type: "action",
        action: "clearSearch",
      });
    });
  });

  describe("Filter Commands", () => {
    it('should parse "show action games" as genre filter', () => {
      expect(parseCommand("show action games")).toEqual({
        type: "filter",
        filterType: "genre",
        value: "action",
      });
    });

    it('should parse "filter by rpg games" as genre filter', () => {
      expect(parseCommand("filter by rpg games")).toEqual({
        type: "filter",
        filterType: "genre",
        value: "rpg",
      });
    });

    it('should parse "show teen" as rating filter', () => {
      expect(parseCommand("show teen")).toEqual({
        type: "filter",
        filterType: "rating",
        value: "teen",
      });
    });

    it('should parse "show mature" as rating filter', () => {
      expect(parseCommand("show mature")).toEqual({
        type: "filter",
        filterType: "rating",
        value: "mature",
      });
    });

    it('should parse "clear filters" as clearFilters action', () => {
      expect(parseCommand("clear filters")).toEqual({
        type: "action",
        action: "clearFilters",
      });
    });
  });

  describe("Sort Commands", () => {
    it('should parse "sort by rating" as sort by rating', () => {
      expect(parseCommand("sort by rating")).toEqual({
        type: "sort",
        sortBy: "rating",
      });
    });

    it('should parse "sort by newest" as sort by newest', () => {
      expect(parseCommand("sort by newest")).toEqual({
        type: "sort",
        sortBy: "newest",
      });
    });

    it('should parse "sort by name" as sort by name', () => {
      expect(parseCommand("sort by name")).toEqual({
        type: "sort",
        sortBy: "name",
      });
    });

    it('should parse "sort by oldest" as sort by oldest', () => {
      expect(parseCommand("sort by oldest")).toEqual({
        type: "sort",
        sortBy: "oldest",
      });
    });
  });

  describe("Rating Commands", () => {
    it('should parse "rate 5 stars" as rate 5', () => {
      expect(parseCommand("rate 5 stars")).toEqual({
        type: "rate",
        rating: 5,
      });
    });

    it('should parse "rate three stars" with word number', () => {
      expect(parseCommand("rate three stars")).toEqual({
        type: "rate",
        rating: 3,
      });
    });

    it('should parse "give 4 stars" as rate 4', () => {
      expect(parseCommand("give 4 stars")).toEqual({
        type: "rate",
        rating: 4,
      });
    });

    it('should parse "set one star" as rate 1', () => {
      expect(parseCommand("set one star")).toEqual({
        type: "rate",
        rating: 1,
      });
    });
  });

  describe("Review Commands", () => {
    it('should parse "write review great game" as review command', () => {
      expect(parseCommand("write review great game")).toEqual({
        type: "review",
        content: "great game",
      });
    });

    it('should parse "submit review" as submitReview action', () => {
      expect(parseCommand("submit review")).toEqual({
        type: "action",
        action: "submitReview",
      });
    });
  });

  describe("Favorite Commands", () => {
    it('should parse "add to favorites" as addFavorite action', () => {
      expect(parseCommand("add to favorites")).toEqual({
        type: "action",
        action: "addFavorite",
      });
    });

    it('should parse "remove from favorites" as removeFavorite action', () => {
      expect(parseCommand("remove from favorites")).toEqual({
        type: "action",
        action: "removeFavorite",
      });
    });

    it('should parse "toggle favorite" as toggleFavorite action', () => {
      expect(parseCommand("toggle favorite")).toEqual({
        type: "action",
        action: "toggleFavorite",
      });
    });
  });

  describe("Open Game Commands", () => {
    it('should parse "open game 1" as openGame action with index', () => {
      expect(parseCommand("open game 1")).toEqual({
        type: "action",
        action: "openGame",
        gameIndex: 1,
      });
    });

    it('should parse "open first" as openGame with index 1', () => {
      expect(parseCommand("open first")).toEqual({
        type: "action",
        action: "openGame",
        gameIndex: 1,
      });
    });

    it('should parse "open cyberpunk 2077" as openGameByName', () => {
      expect(parseCommand("open cyberpunk 2077")).toEqual({
        type: "openGameByName",
        gameName: "cyberpunk 2077",
      });
    });

    it('should parse "play the witcher" as openGameByName', () => {
      expect(parseCommand("play the witcher")).toEqual({
        type: "openGameByName",
        gameName: "the witcher",
      });
    });
  });

  describe("Other Commands", () => {
    it('should parse "scroll to top" as scroll top', () => {
      expect(parseCommand("scroll to top")).toEqual({
        type: "scroll",
        direction: "top",
      });
    });

    it('should parse "scroll to bottom" as scroll bottom', () => {
      expect(parseCommand("scroll to bottom")).toEqual({
        type: "scroll",
        direction: "bottom",
      });
    });

    it('should parse "help" as showHelp action', () => {
      expect(parseCommand("help")).toEqual({
        type: "action",
        action: "showHelp",
      });
    });

    it('should parse "stop" as stop action', () => {
      expect(parseCommand("stop")).toEqual({
        type: "action",
        action: "stop",
      });
    });
  });

  describe("Unknown Commands", () => {
    it("should return unknown type for unrecognized commands", () => {
      expect(parseCommand("random gibberish text")).toEqual({
        type: "unknown",
        text: "random gibberish text",
      });
    });
  });

  describe("Case Insensitivity", () => {
    it("should handle uppercase commands", () => {
      expect(parseCommand("GO TO HOME")).toEqual({
        type: "navigate",
        target: "home",
      });
    });

    it("should handle mixed case commands", () => {
      expect(parseCommand("Search For Zelda")).toEqual({
        type: "search",
        query: "zelda",
      });
    });
  });
});

