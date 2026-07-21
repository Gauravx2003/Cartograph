import { useState, useEffect } from "react";

// The original colors from your TreemapGlyph
const INITIAL_COLORS = [
  "bg-risk-low",
  "bg-risk-mid",
  "bg-risk-high",
  "bg-accent",
  "bg-charcoal",
  "bg-risk-low",
];

// Quotes to cycle through while loading
const LOADING_QUOTES = [
  "Getting there...",
  "Just a minute...",
  "Mapping dependencies...",
  "Basss Pohoch hi gaya ...",
  "Almost ready...",
];

export const Loader = () => {
  const [colors, setColors] = useState(INITIAL_COLORS);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // 1. Animate the logo colors by shifting the array every 400ms
  useEffect(() => {
    const colorInterval = setInterval(() => {
      setColors((prevColors) => {
        const nextColors = [...prevColors];
        const lastColor = nextColors.pop();
        if (lastColor) nextColors.unshift(lastColor);
        return nextColors;
      });
    }, 400);

    return () => clearInterval(colorInterval);
  }, []);

  // 2. Cycle through the loading quotes every 1 seconds
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setQuoteIndex((prevIndex) => (prevIndex + 1) % LOADING_QUOTES.length);
    }, 1000);

    return () => clearInterval(quoteInterval);
  }, []);

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center">
      {/* Animated Treemap Glyph */}
      <div className="grid grid-cols-2 grid-rows-3 gap-0.5 w-8 h-12 mb-6">
        {colors.map((colorClass, index) => (
          <div
            key={index}
            // Added transition-colors so it smoothly blends into the next color
            className={`${colorClass} rounded-sm transition-colors duration-300`}
          />
        ))}
      </div>

      {/* Dynamic Loading Text */}
      <div className="h-6 flex items-center justify-center text-center">
        <p className="text-sm font-medium text-mute animate-pulse">
          {LOADING_QUOTES[quoteIndex]}
        </p>
      </div>
    </div>
  );
};
