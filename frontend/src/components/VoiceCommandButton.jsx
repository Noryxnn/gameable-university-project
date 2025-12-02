import React, { useState, useEffect } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaQuestionCircle, FaTimes } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi2';

const VoiceCommandButton = ({ 
  isListening, 
  isSupported, 
  transcript, 
  interimTranscript,
  error,
  onToggle,
  onShowHelp,
  lastCommand 
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState('info'); // 'info', 'success', 'error'

  // Show feedback when there's a transcript or command
  useEffect(() => {
    if (transcript || lastCommand) {
      setShowFeedback(true);
      
      if (lastCommand?.type === 'unknown') {
        setFeedbackMessage(`Unknown command: "${lastCommand.text}"`);
        setFeedbackType('error');
      } else if (lastCommand) {
        setFeedbackMessage(getCommandFeedback(lastCommand));
        setFeedbackType('success');
      } else {
        setFeedbackMessage(transcript);
        setFeedbackType('info');
      }

      // Auto-hide feedback after 3 seconds
      const timer = setTimeout(() => {
        setShowFeedback(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [transcript, lastCommand]);

  // Show feedback when listening starts
  useEffect(() => {
    if (isListening) {
      setShowFeedback(true);
      setFeedbackMessage('Listening...');
      setFeedbackType('info');
    }
  }, [isListening]);

  const getCommandFeedback = (command) => {
    switch (command.type) {
      case 'navigate':
        return `Navigating to ${command.target}...`;
      case 'search':
        return `Searching for "${command.query}"...`;
      case 'filter':
        return `Applying ${command.filterType} filter: ${command.value}`;
      case 'sort':
        return `Sorting by ${command.sortBy}...`;
      case 'rate':
        return `Rating: ${command.rating} stars`;
      case 'review':
        return `Writing review...`;
      case 'action':
        return getActionFeedback(command.action);
      case 'openGameByName':
        return `Opening "${command.gameName}"...`;
      default:
        return 'Command recognized';
    }
  };

  const getActionFeedback = (action) => {
    switch (action) {
      case 'clearSearch': return 'Clearing search...';
      case 'clearFilters': return 'Clearing filters...';
      case 'addFavorite': return 'Adding to favorites...';
      case 'removeFavorite': return 'Removing from favorites...';
      case 'toggleFavorite': return 'Toggling favorite...';
      case 'submitReview': return 'Submitting review...';
      case 'showHelp': return 'Opening help...';
      case 'logout': return 'Logging out...';
      case 'stop': return 'Stopped listening';
      default: return 'Action executed';
    }
  };

  if (!isSupported) {
    return null; // Don't show button if not supported
  }

  return (
    <>
      {/* Voice Feedback Overlay */}
      {showFeedback && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`
            px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border-2 max-w-md
            ${feedbackType === 'success' ? 'bg-green-900/90 border-green-500/50 text-green-100' : ''}
            ${feedbackType === 'error' ? 'bg-red-900/90 border-red-500/50 text-red-100' : ''}
            ${feedbackType === 'info' ? 'bg-purple-900/90 border-purple-500/50 text-purple-100' : ''}
          `}>
            <div className="flex items-center gap-3">
              {isListening && (
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              )}
              {!isListening && feedbackType === 'success' && (
                <HiSparkles className="w-5 h-5" />
              )}
              <span className="font-medium">
                {interimTranscript || feedbackMessage}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Voice Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Help Button */}
        <button
          onClick={onShowHelp}
          className="w-12 h-12 rounded-full bg-gray-900/90 backdrop-blur-xl border-2 border-purple-500/50 text-purple-400 hover:border-purple-400 hover:text-purple-300 shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center"
          title="Voice command help"
          aria-label="Show voice command help"
        >
          <FaQuestionCircle className="w-5 h-5" />
        </button>

        {/* Main Microphone Button */}
        <button
          onClick={onToggle}
          disabled={!isSupported}
          className={`
            w-16 h-16 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center
            ${isListening 
              ? 'bg-gradient-to-r from-red-500 to-pink-500 border-4 border-white/30 scale-110 animate-pulse shadow-red-500/50' 
              : 'bg-gradient-to-r from-purple-600 to-pink-600 border-4 border-purple-400/30 hover:scale-105 hover:shadow-purple-500/50'
            }
            ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          title={isListening ? 'Stop listening' : 'Start voice command'}
          aria-label={isListening ? 'Stop voice command' : 'Start voice command'}
        >
          {isListening ? (
            <FaMicrophoneSlash className="w-7 h-7 text-white" />
          ) : (
            <FaMicrophone className="w-7 h-7 text-white" />
          )}
        </button>

        {/* Listening indicator ring */}
        {isListening && (
          <div className="absolute bottom-0 right-0 w-16 h-16 rounded-full border-4 border-pink-400 animate-ping pointer-events-none" />
        )}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-28 right-6 z-50 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="px-4 py-3 rounded-xl bg-red-900/90 backdrop-blur-xl border-2 border-red-500/50 text-red-100 shadow-xl max-w-xs">
            <div className="flex items-center gap-2">
              <FaMicrophoneSlash className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">
                {error === 'not-allowed' 
                  ? 'Microphone access denied. Please enable it in your browser settings.'
                  : error === 'no-speech'
                  ? 'No speech detected. Try again.'
                  : `Error: ${error}`
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Voice Command Help Modal
export const VoiceCommandHelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const commands = [
    {
      category: '🧭 Navigation',
      items: [
        { command: '"Go to home"', description: 'Navigate to home page' },
        { command: '"Go to profile"', description: 'Open your profile' },
        { command: '"Go to favorites"', description: 'View saved games' },
        { command: '"Go to social"', description: 'Open social page' },
        { command: '"Go back"', description: 'Go to previous page' },
        { command: '"Log out"', description: 'Sign out of your account' },
      ]
    },
    {
      category: '🔍 Search',
      items: [
        { command: '"Search for [game name]"', description: 'Search for a game' },
        { command: '"Find [keyword]"', description: 'Search by keyword' },
        { command: '"Clear search"', description: 'Clear search results' },
      ]
    },
    {
      category: '🎯 Filters',
      items: [
        { command: '"Show action games"', description: 'Filter by genre' },
        { command: '"Filter by RPG"', description: 'Filter by genre' },
        { command: '"Show everyone rated"', description: 'Filter by E rating' },
        { command: '"Show teen rated"', description: 'Filter by T rating' },
        { command: '"Show mature rated"', description: 'Filter by M rating' },
        { command: '"Clear filters"', description: 'Remove all filters' },
      ]
    },
    {
      category: '📊 Sorting',
      items: [
        { command: '"Sort by rating"', description: 'Sort by highest rated' },
        { command: '"Sort by newest"', description: 'Sort by release date' },
        { command: '"Sort by name"', description: 'Sort alphabetically' },
      ]
    },
    {
      category: '⭐ Reviews',
      items: [
        { command: '"Rate 5 stars"', description: 'Set rating (1-5)' },
        { command: '"Rate three stars"', description: 'Works with words too' },
        { command: '"Write review [text]"', description: 'Write review content' },
        { command: '"Submit review"', description: 'Submit your review' },
      ]
    },
    {
      category: '❤️ Favorites',
      items: [
        { command: '"Add to favorites"', description: 'Save current game' },
        { command: '"Remove from favorites"', description: 'Unsave game' },
        { command: '"Toggle favorite"', description: 'Toggle favorite status' },
      ]
    },
    {
      category: '🎮 Games',
      items: [
        { command: '"Open Cyberpunk 2077"', description: 'Open a game by name' },
        { command: '"Play The Witcher"', description: 'Open game page' },
        { command: '"Open game 1"', description: 'Open first game in list' },
      ]
    },
    {
      category: '⚙️ Other',
      items: [
        { command: '"Scroll to top"', description: 'Scroll to page top' },
        { command: '"Scroll to bottom"', description: 'Scroll to page bottom' },
        { command: '"Help"', description: 'Show this help' },
        { command: '"Stop"', description: 'Stop listening' },
      ]
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 border-2 border-purple-500/50 rounded-2xl shadow-2xl shadow-purple-500/20 max-w-3xl w-full max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-purple-500/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
              <FaMicrophone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Voice Commands</h2>
              <p className="text-sm text-purple-400">Say these commands to control GameAble</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Close help"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="grid md:grid-cols-2 gap-6">
            {commands.map((category, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="text-lg font-bold text-white">{category.category}</h3>
                <div className="space-y-2">
                  {category.items.map((item, itemIdx) => (
                    <div 
                      key={itemIdx}
                      className="flex items-start gap-3 p-3 bg-black/30 rounded-xl border border-purple-500/20"
                    >
                      <code className="text-cyan-400 font-mono text-sm whitespace-nowrap">
                        {item.command}
                      </code>
                      <span className="text-white/70 text-sm">
                        {item.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-purple-600/20 rounded-xl border border-purple-500/30">
            <h4 className="font-bold text-purple-300 mb-2">💡 Tips</h4>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• Click the microphone button or say "Stop" to stop listening</li>
              <li>• Speak clearly and wait for the feedback to appear</li>
              <li>• Commands work on any page where they make sense</li>
              <li>• You can say numbers as words: "five stars" or "5 stars"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceCommandButton;

