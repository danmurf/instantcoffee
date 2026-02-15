import { useState, useEffect } from 'react';

interface LoadingPhrase {
  emoji: string;
  verb: string;
}

const LOADING_PHRASES: LoadingPhrase[] = [
  { emoji: '🤔', verb: 'Thinking' },
  { emoji: '☕', verb: 'Sipping' },
  { emoji: '🌩️', verb: 'Storming' },
  { emoji: '🎨', verb: 'Sketching' },
  { emoji: '🔮', verb: 'Envisioning' },
  { emoji: '🧩', verb: 'Puzzling' },
  { emoji: '✨', verb: 'Conjuring' },
  { emoji: '🚀', verb: 'Launching' },
  { emoji: '🎯', verb: 'Aiming' },
  { emoji: '🔬', verb: 'Analyzing' },
  { emoji: '🎭', verb: 'Composing' },
  { emoji: '🌊', verb: 'Flowing' },
  { emoji: '💡', verb: 'Illuminating' },
  { emoji: '🎪', verb: 'Orchestrating' },
  { emoji: '🌟', verb: 'Sparkling' },
  { emoji: '🎲', verb: 'Randomizing' },
  { emoji: '🧬', verb: 'Synthesizing' },
  { emoji: '🎵', verb: 'Harmonizing' },
  { emoji: '🔥', verb: 'Kindling' },
  { emoji: '🌈', verb: 'Dreaming' },
];

export function LoadingAnimation() {
  const [phraseIndex, setPhraseIndex] = useState(() =>
    Math.floor(Math.random() * LOADING_PHRASES.length)
  );
  const [dotCount, setDotCount] = useState(1);

  // Rotate phrases every 5 seconds
  useEffect(() => {
    const phraseInterval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
    }, 5000);

    return () => clearInterval(phraseInterval);
  }, []);

  // Animate dots every 500ms (1 -> 2 -> 3 -> 1)
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 500);

    return () => clearInterval(dotInterval);
  }, []);

  const currentPhrase = LOADING_PHRASES[phraseIndex];
  const dots = '.'.repeat(dotCount);

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <span className="text-base">{currentPhrase.emoji}</span>
      <span className="italic">
        <span className="bg-gradient-to-r from-gray-600 via-gray-800 to-gray-600 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
          {currentPhrase.verb}
        </span>
        <span className="inline-block w-6 text-left">{dots}</span>
      </span>
    </div>
  );
}
