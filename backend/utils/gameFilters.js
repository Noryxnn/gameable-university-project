/**
 * Builds a MongoDB query object for filtering games by genre and accessibility features.
 * 
 * @param {string[]} genres - Array of genre strings to filter by (OR logic)
 * @param {string[]} accessibilityFeatures - Array of accessibility feature strings to filter by (AND logic)
 * @returns {Object} MongoDB query object
 */
export const buildGameFilterQuery = (genres = [], accessibilityFeatures = []) => {
  const query = {};

  // Genre filtering: OR logic - game.genre must match one of the selected genres
  if (genres.length > 0) {
    query.genre = { $in: genres };
  }

  // Accessibility filtering: AND logic - game must have ALL selected accessibility features
  if (accessibilityFeatures.length > 0) {
    query.accessibilityFeatures = { $all: accessibilityFeatures };
  }

  return query;
};

/**
 * Parses comma-separated query parameter strings into arrays of trimmed strings.
 * 
 * @param {string} param - Comma-separated string from query parameter
 * @returns {string[]} Array of trimmed, non-empty strings
 */
export const parseFilterParam = (param) => {
  if (!param || typeof param !== 'string') {
    return [];
  }

  return param
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
};

