import { useState, useEffect } from 'react';

interface LoadingPhrase {
  emoji: string;
  verb: string;
}

const CONSOLIDATION_PHRASES: LoadingPhrase[] = [
  { emoji: '🧹', verb: 'Sweeping' },
  { emoji: '✨', verb: 'Sparkling' },
  { emoji: '🧽', verb: 'Scrubbing' },
  { emoji: '🗑️', verb: 'Discarding' },
  { emoji: '📦', verb: 'Organizing' },
  { emoji: '🧺', verb: 'Laundering' },
  { emoji: '📋', verb: 'Sorting' },
  { emoji: '🔄', verb: 'Deduplicating' },
  { emoji: '✂️', verb: 'Trimming' },
  { emoji: '🧹', verb: 'Brushing' },
  { emoji: '📚', verb: 'Cataloging' },
  { emoji: '🏷️', verb: 'Tagging' },
  { emoji: '🧩', verb: 'Consolidating' },
  { emoji: '⚙️', verb: 'Refining' },
  { emoji: '💎', verb: 'Buffing' },
  { emoji: '🔧', verb: 'Tightening' },
  { emoji: '🎯', verb: 'Curating' },
  { emoji: '🧲', verb: 'Collecting' },
  { emoji: '🏠', verb: 'Arranging' },
  { emoji: '✨', verb: 'Gleaming' },
];

interface MemoryConsolidationModalProps {
  isOpen: boolean;
  memoryCount?: number;
}

export function MemoryConsolidationModal({ isOpen, memoryCount = 0 }: MemoryConsolidationModalProps) {
  const [phraseIndex, setPhraseIndex] = useState(() =>
    Math.floor(Math.random() * CONSOLIDATION_PHRASES.length)
  );
  const [dotCount, setDotCount] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Rotate phrases every 5 seconds
  useEffect(() => {
    if (!isOpen) return;

    const phraseInterval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % CONSOLIDATION_PHRASES.length);
    }, 5000);

    return () => clearInterval(phraseInterval);
  }, [isOpen]);

  // Animate dots every 500ms (1 -> 2 -> 3 -> 1)
  useEffect(() => {
    if (!isOpen) return;

    const dotInterval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 500);

    return () => clearInterval(dotInterval);
  }, [isOpen]);

  // Track elapsed time
  useEffect(() => {
    if (!isOpen) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPhrase = CONSOLIDATION_PHRASES[phraseIndex];
  const dots = '.'.repeat(dotCount);

  // Generate helpful message based on memory count and elapsed time
  let subtitle = 'Consolidating memories';
  if (memoryCount > 30) {
    if (elapsedSeconds < 15) {
      subtitle = `Processing ${memoryCount} memories - this may take 1-2 minutes...`;
    } else if (elapsedSeconds < 45) {
      subtitle = `Still tidying up ${memoryCount} memories... hang tight!`;
    } else if (elapsedSeconds < 90) {
      subtitle = `Good things take time! Almost there... ☕`;
    } else {
      subtitle = `Worth the wait! Just a bit longer... (${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s)`;
    }
  } else if (elapsedSeconds > 20 && elapsedSeconds < 45) {
    subtitle = `Hang in there! Quality cleaning takes time... ✨`;
  } else if (elapsedSeconds >= 45) {
    subtitle = `Still polishing... patience is a virtue! (${elapsedSeconds}s)`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>

      {/* Modal */}
      <div className="relative z-10 rounded-lg bg-white px-8 py-6 shadow-2xl">
        <div className="flex flex-col items-center space-y-4">
          {/* Animated emoji */}
          <div className="text-5xl animate-pulse">
            {currentPhrase.emoji}
          </div>

          {/* Loading text */}
          <div className="flex flex-col items-center space-y-1">
            <div className="flex items-center space-x-2 text-lg text-gray-600">
              <span className="italic">
                <span className="bg-gradient-to-r from-gray-600 via-gray-800 to-gray-600 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                  {currentPhrase.verb}
                </span>
                <span className="inline-block w-6 text-left">{dots}</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 text-center max-w-xs">
              {subtitle}
            </p>
          </div>

          {/* Spinner */}
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"></div>
        </div>
      </div>
    </div>
  );
}
