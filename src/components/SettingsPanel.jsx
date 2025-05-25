import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

const SettingsPanel = () => {
  const {
    lineSpacing, setLineSpacing,
    chordSpacing, setChordSpacing,
    chordSize, setChordSize,
    lyricSize, setLyricSize,
    containerWidth, setContainerWidth,
    containerHeight, setContainerHeight,
    backgroundColor, setBackgroundColor,
    textColor, setTextColor,
    chordColor, setChordColor
  } = useSettings();

  return (
    <div className="mb-6 space-y-4">
      <div>
        <label className="block font-semibold mb-1" htmlFor="lineSpacing">
          Відступ між рядками (px): {lineSpacing}
        </label>
        <input
          id="lineSpacing"
          type="range"
          min="-40"
          max="40"
          value={lineSpacing}
          onChange={(e) => setLineSpacing(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1" htmlFor="chordSpacing">
          Відступ для акордів (px): {chordSpacing}
        </label>
        <input
          id="chordSpacing"
          type="range"
          min="-40"
          max="40"
          value={chordSpacing}
          onChange={(e) => setChordSpacing(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1" htmlFor="chordSize">
          Розмір акордів (px): {chordSize}
        </label>
        <input
          id="chordSize"
          type="range"
          min="10"
          max="48"
          value={chordSize}
          onChange={(e) => setChordSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1" htmlFor="lyricSize">
          Розмір тексту (px): {lyricSize}
        </label>
        <input
          id="lyricSize"
          type="range"
          min="10"
          max="32"
          value={lyricSize}
          onChange={(e) => setLyricSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1" htmlFor="containerWidth">
          Ширина контейнера (px): {containerWidth}
        </label>
        <input
          id="containerWidth"
          type="range"
          min="200"
          max="2000"
          value={containerWidth}
          onChange={(e) => setContainerWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1" htmlFor="containerHeight">
          Висота контейнера (px): {containerHeight}
        </label>
        <input
          id="containerHeight"
          type="range"
          min="200"
          max="2000"
          value={containerHeight}
          onChange={(e) => setContainerHeight(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Горизонтальне розташування елементів керування кольорами */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block font-semibold mb-1" htmlFor="backgroundColor">
            Колір фону:
          </label>
          <input
            id="backgroundColor"
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-full h-10"
          />
        </div>
        
        <div className="flex-1">
          <label className="block font-semibold mb-1" htmlFor="textColor">
            Колір тексту:
          </label>
          <input
            id="textColor"
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-full h-10"
          />
        </div>
        
        <div className="flex-1">
          <label className="block font-semibold mb-1" htmlFor="chordColor">
            Колір акордів:
          </label>
          <input
            id="chordColor"
            type="color"
            value={chordColor}
            onChange={(e) => setChordColor(e.target.value)}
            className="w-full h-10"
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
