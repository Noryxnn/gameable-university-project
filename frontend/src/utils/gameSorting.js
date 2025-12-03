import { SORT_OPTIONS, RATING_FILTERS } from "./gameConstants";

/**
 * Sorts an array of games based on the selected sort option.
 * 
 * @param {Object[]} games - Array of game objects to sort
 * @param {string} sortOption - Sort option from SORT_OPTIONS
 * @returns {Object[]} Sorted array of games
 */
export const sortGames = (games = [], sortOption = SORT_OPTIONS.DEFAULT) => {
  if (!Array.isArray(games) || games.length === 0) {
    return games;
  }

  const gamesCopy = [...games];

  switch (sortOption) {
    case SORT_OPTIONS.TITLE_ASC:
      return gamesCopy.sort((a, b) => {
        const titleA = (a.title || "").toLowerCase();
        const titleB = (b.title || "").toLowerCase();
        return titleA.localeCompare(titleB);
      });

    case SORT_OPTIONS.TITLE_DESC:
      return gamesCopy.sort((a, b) => {
        const titleA = (a.title || "").toLowerCase();
        const titleB = (b.title || "").toLowerCase();
        return titleB.localeCompare(titleA);
      });

    case SORT_OPTIONS.RATING_DESC:
      return gamesCopy.sort((a, b) => {
        const ratingA = a.reviewScore || 0;
        const ratingB = b.reviewScore || 0;
        return ratingB - ratingA;
      });

    case SORT_OPTIONS.RATING_ASC:
      return gamesCopy.sort((a, b) => {
        const ratingA = a.reviewScore || 0;
        const ratingB = b.reviewScore || 0;
        return ratingA - ratingB;
      });

    case SORT_OPTIONS.RELEASE_YEAR_DESC:
      return gamesCopy.sort((a, b) => {
        const yearA = a.releaseYear || 0;
        const yearB = b.releaseYear || 0;
        return yearB - yearA;
      });

    case SORT_OPTIONS.RELEASE_YEAR_ASC:
      return gamesCopy.sort((a, b) => {
        const yearA = a.releaseYear || 0;
        const yearB = b.releaseYear || 0;
        return yearA - yearB;
      });

    case SORT_OPTIONS.DEFAULT:
    default:
      return gamesCopy;
  }
};

/**
 * Filters games by rating.
 * 
 * @param {Object[]} games - Array of game objects to filter
 * @param {string} ratingFilter - Rating filter from RATING_FILTERS
 * @returns {Object[]} Filtered array of games
 */
export const filterGamesByRating = (games = [], ratingFilter) => {
  if (!Array.isArray(games) || games.length === 0) {
    return games;
  }

  if (!ratingFilter || ratingFilter === RATING_FILTERS.ALL) {
    return games;
  }

  return games.filter(game => {
    const gameRating = game.rating || "";
    // Direct match - rating values are stored as "E", "E10+", "T", "M"
    return gameRating === ratingFilter;
  });
};

