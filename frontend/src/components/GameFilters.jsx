import React, { useState, useRef, useEffect } from "react";
import { FaFilter, FaTimes, FaSort, FaStar, FaChevronDown } from "react-icons/fa";
import { ALL_GENRES, SORT_OPTIONS, RATING_FILTERS } from "../utils/gameConstants";

/**
 * CustomDropdown Component
 * 
 * A styled dropdown that matches the theme with custom styling.
 */
const CustomDropdown = ({ label, icon, value, onChange, options, colorScheme = "purple" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  const getColorClasses = (scheme) => {
    if (scheme === "purple") {
      return {
        border: "border-purple-500/30",
        borderOpen: "border-purple-400",
        bgSelected: "bg-purple-600/40",
        text: "text-purple-400",
        shadow: "shadow-purple-500/30",
        gradient: "from-purple-600/40 to-pink-600/40",
      };
    } else {
      return {
        border: "border-pink-500/30",
        borderOpen: "border-pink-400",
        bgSelected: "bg-pink-600/40",
        text: "text-pink-400",
        shadow: "shadow-pink-500/30",
        gradient: "from-pink-600/40 to-purple-600/40",
      };
    }
  };

  const colors = getColorClasses(colorScheme);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        {icon && <span className={colors.text}>{icon}</span>}
        {label}
      </h3>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-3 bg-black/60 border-2 ${
            isOpen ? colors.borderOpen : colors.border
          } text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-between backdrop-blur-sm ${
            isOpen ? `${colors.bgSelected} shadow-lg ${colors.shadow}` : ""
          } ${colorScheme === "purple" ? "hover:bg-purple-900/30" : "hover:bg-pink-900/30"}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="flex-1 text-left">{selectedOption.label}</span>
          <FaChevronDown
            className={`w-4 h-4 ${colors.text} transition-transform duration-200 ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div
            className={`absolute z-50 w-full mt-2 bg-black/90 border-2 ${colors.borderOpen} rounded-xl shadow-2xl ${colors.shadow} backdrop-blur-xl overflow-hidden`}
            role="listbox"
          >
            <div className="max-h-64 overflow-y-auto">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full text-left px-4 py-3 font-medium transition-all duration-150 ${
                      isSelected
                        ? `bg-gradient-to-r ${colors.gradient} text-white shadow-lg ${colors.shadow}`
                        : `text-white/80 hover:text-white ${
                            colorScheme === "purple" 
                              ? "hover:bg-purple-900/30" 
                              : "hover:bg-pink-900/30"
                          }`
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {isSelected && (
                        <span className={`${colors.text} text-sm font-bold`}>✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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
        <CustomDropdown
          label="Sort By"
          icon={<FaSort className="w-4 h-4" />}
          value={selectedSort}
          onChange={onChangeSelectedSort}
          options={[
            { value: SORT_OPTIONS.DEFAULT, label: "Default" },
            { value: SORT_OPTIONS.TITLE_ASC, label: "Title (A-Z)" },
            { value: SORT_OPTIONS.TITLE_DESC, label: "Title (Z-A)" },
            { value: SORT_OPTIONS.RATING_DESC, label: "Rating (High to Low)" },
            { value: SORT_OPTIONS.RATING_ASC, label: "Rating (Low to High)" },
            { value: SORT_OPTIONS.RELEASE_YEAR_DESC, label: "Newest First" },
            { value: SORT_OPTIONS.RELEASE_YEAR_ASC, label: "Oldest First" },
          ]}
          colorScheme="purple"
        />

        {/* Rating Filter */}
        <CustomDropdown
          label="Rating"
          icon={<FaStar className="w-4 h-4" />}
          value={selectedRating}
          onChange={onChangeSelectedRating}
          options={[
            { value: RATING_FILTERS.ALL, label: "All Ratings" },
            { value: RATING_FILTERS.E, label: "E (Everyone)" },
            { value: RATING_FILTERS.E10, label: "E10+ (Everyone 10+)" },
            { value: RATING_FILTERS.T, label: "T (Teen)" },
            { value: RATING_FILTERS.M, label: "M (Mature)" },
          ]}
          colorScheme="pink"
        />

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

