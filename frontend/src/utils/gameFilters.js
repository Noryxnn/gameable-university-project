/**
 * Checks if a game matches the selected genre and accessibility filters.
 * 
 * Filter logic:
 * - Genre: OR logic - game must match at least one selected genre
 * - Accessibility: AND logic - game must have ALL selected accessibility features
 * 
 * @param {Object} game - Game object with genre and accessibilityFeatures properties
 * @param {string[]} selectedGenres - Array of selected genre strings
 * @param {string[]} selectedAccessibilityFeatures - Array of selected accessibility feature strings
 * @returns {boolean} True if game matches all filter criteria, false otherwise
 */
export const matchesFilters = (game, selectedGenres = [], selectedAccessibilityFeatures = []) => {
  // If no filters selected, all games match
  if (selectedGenres.length === 0 && selectedAccessibilityFeatures.length === 0) {
    return true;
  }

  // Check genre filter (OR logic)
  if (selectedGenres.length > 0) {
    const gameGenre = game.genre || '';
    const matchesGenre = selectedGenres.some(genre => 
      gameGenre.trim().toLowerCase() === genre.trim().toLowerCase()
    );
    if (!matchesGenre) {
      return false;
    }
  }

  // Check accessibility features filter (AND logic)
  if (selectedAccessibilityFeatures.length > 0) {
    const gameFeatures = Array.isArray(game.accessibilityFeatures) 
      ? game.accessibilityFeatures 
      : [];
    
    // All selected features must be present in the game
    const hasAllFeatures = selectedAccessibilityFeatures.every(selectedFeature => {
      return gameFeatures.some(gameFeature => 
        gameFeature.trim().toLowerCase() === selectedFeature.trim().toLowerCase()
      );
    });

    if (!hasAllFeatures) {
      return false;
    }
  }

  return true;
};

/**
 * Derives unique, sorted array of genres from games array.
 * 
 * @param {Object[]} games - Array of game objects
 * @returns {string[]} Sorted array of unique genre strings
 */
export const deriveAvailableGenres = (games) => {
  if (!Array.isArray(games) || games.length === 0) {
    return [];
  }

  const genresSet = new Set();
  
  games.forEach(game => {
    if (game.genre && typeof game.genre === 'string' && game.genre.trim()) {
      genresSet.add(game.genre.trim());
    }
  });

  return Array.from(genresSet).sort();
};

/**
 * Derives unique, sorted array of accessibility features from games array.
 * 
 * @param {Object[]} games - Array of game objects
 * @returns {string[]} Sorted array of unique accessibility feature strings
 */
export const deriveAvailableAccessibilityFeatures = (games) => {
  if (!Array.isArray(games) || games.length === 0) {
    return [];
  }

  const featuresSet = new Set();
  
  games.forEach(game => {
    if (Array.isArray(game.accessibilityFeatures)) {
      game.accessibilityFeatures.forEach(feature => {
        if (feature && typeof feature === 'string' && feature.trim()) {
          featuresSet.add(feature.trim());
        }
      });
    }
  });

  return Array.from(featuresSet).sort();
};

