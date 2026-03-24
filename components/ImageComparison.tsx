'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface ImageComparisonProps {
  originalUrl: string;
  resultUrl: string;
  bgColor: string;
}

export default function ImageComparison({ originalUrl, resultUrl, bgColor }: ImageComparisonProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updateSlider = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  const onMouseDown = () => { isDragging.current = true; };
  const onMouseUp = () => { isDragging.current = false; };
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) updateSlider(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    updateSlider(e.touches[0].clientX);
  };

  useEffect(() => {
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, []);

  // Checker pattern background (to show transparency)
  const checkerStyle = bgColor === 'transparent'
    ? {
        backgroundImage: `
          linear-gradient(45deg, #ccc 25%, transparent 25%),
          linear-gradient(-45deg, #ccc 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #ccc 75%),
          linear-gradient(-45deg, transparent 75%, #ccc 75%)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
      }
    : { backgroundColor: bgColor };

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl select-none cursor-col-resize shadow-lg"
        style={{ aspectRatio: '16/9', maxHeight: '480px' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onTouchMove={onTouchMove}
      >
        {/* Right: result with background */}
        <div className="absolute inset-0" style={checkerStyle}>
          <img
            src={resultUrl}
            alt="Result"
            className="absolute inset-0 w-full h-full object-contain"
          />
        </div>

        {/* Left: original (clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={originalUrl}
            alt="Original"
            className="absolute inset-0 w-full h-full object-contain"
            style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }}
          />
        </div>

        {/* Slider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xl"
          style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
        >
          {/* Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l-4 3 4 3M16 9l4 3-4 3" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">Original</div>
        <div className="absolute top-3 right-3 bg-purple-600/80 text-white text-xs px-2 py-1 rounded-full">Removed</div>
      </div>

      <p className="text-center text-sm text-gray-500">← Drag to compare →</p>
    </div>
  );
}
