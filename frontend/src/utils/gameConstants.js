/**
 * All available game genres.
 * This is the source of truth for genre options in the filter.
 * Genres not yet in the database can still be shown as filter options.
 */
export const ALL_GENRES = [
  "Action",
  "Action-Adventure",
  "Action RPG",
  "Adventure",
  "Battle Royale",
  "Fighting",
  "Horror",
  "Metroidvania",
  "MMO",
  "Platformer",
  "Puzzle",
  "Racing",
  "Roguelike",
  "RPG",
  "Sandbox",
  "Shooter",
  "Simulation",
  "Sports",
  "Strategy",
  "Survival",
  "Visual Novel",
].sort(); // Sort alphabetically

/**
 * Rating filter options
 */
export const RATING_FILTERS = {
  ALL: "all",
  E: "E",
  E10: "E10+",
  T: "T",
  M: "M",
};

/**
 * Sort options
 */
export const SORT_OPTIONS = {
  DEFAULT: "default",
  TITLE_ASC: "title-asc",
  TITLE_DESC: "title-desc",
  RATING_ASC: "rating-asc",
  RATING_DESC: "rating-desc",
  RELEASE_YEAR_ASC: "releaseYear-asc",
  RELEASE_YEAR_DESC: "releaseYear-desc",
};

/**
 * All available accessibility features.
 * This is the source of truth for accessibility options.
 */
export const ALL_ACCESSIBILITY_FEATURES = [
  "Full Captions",
  "Subtitles",
  "Screen Reader",
  "Colorblind",
  "Large Target Inputs",
  "One-Handed",
  "Voice Control",
  "Custom Controls",
  "Hearing",
  "Visual",
  "Dexterity",
  "Cognitive",
].sort();

