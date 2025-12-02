import React from "react";
import { FaFilter, FaTimes, FaSort } from "react-icons/fa";
import { ALL_GENRES, SORT_OPTIONS, RATING_FILTERS } from "../utils/gameConstants";

/**
 * GameFilters Component
 * 
 * Displays filter controls for genres, accessibility features, sorting, and rating.
 * Allows users to select multiple options in each category.
 */
const GameFilters = ({
  availableGenres = [],
  availableAccessibilityFeatures = [],
  selectedGenres = [],
  selectedAccessibilityFeatures = [],
  selectedRating = RATING_FILTERS.ALL,
  selectedSort = SORT_OPTIONS.DEFAULT,
  onChangeSelectedGenres,
  onChangeSelectedAccessibilityFeatures,
  onChangeSelectedRating,
  onChangeSelectedSort,
  onClearFilters,
}) => {
  const hasActiveFilters = selectedGenres.length > 0 || selectedAccessibilityFeatures.length > 0 || selectedRating !== RATING_FILTERS.ALL || selectedSort !== SORT_OPTIONS.DEFAULT;
  
  // Merge available genres from data with all possible genres
  // Show all genres, but mark which ones have games
  const allGenresToShow = ALL_GENRES.map(genre => ({
    name: genre,
    hasGames: availableGenres.includes(genre),
  }));

  const handleGenreToggle = (genre, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const newSelection = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre)
      : [...selectedGenres, genre];
    onChangeSelectedGenres(newSelection);
  };

  const handleAccessibilityToggle = (feature, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const newSelection = selectedAccessibilityFeatures.includes(feature)
      ? selectedAccessibilityFeatures.filter(f => f !== feature)
      : [...selectedAccessibilityFeatures, feature];
    onChangeSelectedAccessibilityFeatures(newSelection);
  };

  return (
    <div className="p-6 bg-black/60 border-2 border-purple-500/40 backdrop-blur-xl shadow-2xl shadow-purple-500/20 rounded-2xl max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <FaFilter className="w-6 h-6 text-pink-400" />
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Filters
          </span>
        </h2>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 text-white hover:text-pink-300 hover:bg-pink-900/30 rounded-lg font-semibold px-3 py-1.5 transition-colors text-sm"
            aria-label="Clear all filters"
          >
            <FaTimes className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Sort Options */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <FaSort className="w-4 h-4 text-purple-400" />
            Sort By
          </h3>
          <select
            value={selectedSort}
            onChange={(e) => onChangeSelectedSort(e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border-2 border-purple-500/30 text-white rounded-lg font-medium focus:border-purple-400 focus:outline-none transition-colors"
          >
            <option value={SORT_OPTIONS.DEFAULT}>Default</option>
            <option value={SORT_OPTIONS.TITLE_ASC}>Title (A-Z)</option>
            <option value={SORT_OPTIONS.TITLE_DESC}>Title (Z-A)</option>
            <option value={SORT_OPTIONS.RATING_DESC}>Rating (High to Low)</option>
            <option value={SORT_OPTIONS.RATING_ASC}>Rating (Low to High)</option>
            <option value={SORT_OPTIONS.RELEASE_YEAR_DESC}>Newest First</option>
            <option value={SORT_OPTIONS.RELEASE_YEAR_ASC}>Oldest First</option>
          </select>
        </div>

        {/* Rating Filter */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Rating</h3>
          <select
            value={selectedRating}
            onChange={(e) => onChangeSelectedRating(e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border-2 border-purple-500/30 text-white rounded-lg font-medium focus:border-purple-400 focus:outline-none transition-colors"
          >
            <option value={RATING_FILTERS.ALL}>All Ratings</option>
            <option value={RATING_FILTERS.E}>E (Everyone)</option>
            <option value={RATING_FILTERS.E10}>E10+ (Everyone 10+)</option>
            <option value={RATING_FILTERS.T}>T (Teen)</option>
            <option value={RATING_FILTERS.M}>M (Mature)</option>
          </select>
        </div>

        {/* Genre Filters */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Genre</h3>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {allGenresToShow.map(({ name, hasGames }) => {
              const isSelected = selectedGenres.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={(e) => handleGenreToggle(name, e)}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-all border-2 ${
                    isSelected
                      ? "bg-purple-600/40 border-purple-400 text-white shadow-lg shadow-purple-500/30"
                      : "bg-black/40 border-purple-500/30 text-white/80 hover:border-purple-400 hover:bg-purple-900/20"
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Filter by ${name}`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accessibility Features Filters */}
        {availableAccessibilityFeatures.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Accessibility</h3>
            <p className="text-white/60 text-xs mb-3">
              Games must have all selected features.
            </p>
            <div className="flex flex-col gap-2">
              {availableAccessibilityFeatures.map((feature) => {
                const isSelected = selectedAccessibilityFeatures.includes(feature);
                return (
                  <button
                    key={feature}
                    type="button"
                    onClick={(e) => handleAccessibilityToggle(feature, e)}
                    className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-all border-2 ${
                      isSelected
                        ? "bg-cyan-600/40 border-cyan-400 text-white shadow-lg shadow-cyan-500/30"
                        : "bg-black/40 border-cyan-500/30 text-white/80 hover:border-cyan-400 hover:bg-cyan-900/20"
                    }`}
                    aria-pressed={isSelected}
                    aria-label={`Filter by ${feature}`}
                  >
                    {feature}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {availableAccessibilityFeatures.length === 0 && (
          <p className="text-white/60 text-xs text-center py-2">
            No accessibility options available.
          </p>
        )}
      </div>
    </div>
  );
};

export default GameFilters;

