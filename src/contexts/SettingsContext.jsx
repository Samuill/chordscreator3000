import React, { createContext, useContext, useState } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [showChords, setShowChords] = useState(true);
  const [showLyrics, setShowLyrics] = useState(true);
  const [chordSize, setChordSize] = useState(18);
  const [lyricSize, setLyricSize] = useState(16);
  const [containerWidth, setContainerWidth] = useState(600);
  const [containerHeight, setContainerHeight] = useState(1000);
  const [twoColumns, setTwoColumns] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");
  const [chordColor, setChordColor] = useState("#6b4f2a");
  const [lineSpacing, setLineSpacing] = useState(10);
  const [chordSpacing, setChordSpacing] = useState(5);

  const value = {
    showChords, setShowChords,
    showLyrics, setShowLyrics,
    chordSize, setChordSize,
    lyricSize, setLyricSize,
    containerWidth, setContainerWidth,
    containerHeight, setContainerHeight,
    twoColumns, setTwoColumns,
    backgroundColor, setBackgroundColor,
    textColor, setTextColor,
    chordColor, setChordColor,
    lineSpacing, setLineSpacing,
    chordSpacing, setChordSpacing
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
