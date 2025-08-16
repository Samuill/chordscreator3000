import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

const DisplayLine = React.memo(({ chords, lyrics, isStructure }) => {
  const {
    showChords,
    showLyrics,
    chordSize,
    lyricSize,
    chordColor,
    textColor,
    lineSpacing,
    chordSpacing
  } = useSettings();

  return (
    <div style={{ marginTop: lineSpacing, marginBottom: lineSpacing }}>
      {(isStructure || showChords) && chords && (
        <div
          className="font-bold mb-0.5 chord-word-spacing"
          style={{ 
            fontSize: `${chordSize}px`, 
            whiteSpace: "pre", 
            fontFamily: "monospace",
            color: chordColor,
            marginTop: chordSpacing,
            marginBottom: chordSpacing
          }}
        >
          {chords}
        </div>
      )}
      {showLyrics && (
        <div style={{ fontSize: `${lyricSize}px`, whiteSpace: "pre-wrap", color: textColor }}>
          {lyrics}
        </div>
      )}
    </div>
  );
});

export default DisplayLine;
