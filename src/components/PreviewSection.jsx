import React, { forwardRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import InteractiveDisplayLine from './InteractiveDisplayLine';

const PreviewSection = forwardRef(({ 
  lines, 
  title, 
  description, 
  leftLines, 
  rightLines, 
  onChordMove 
}, ref) => {
  const { containerHeight, backgroundColor, textColor, twoColumns } = useSettings();
  
  console.log('Preview lines:', lines); // Додаємо для відладки

  return (
    <div
      ref={ref}
      className={`p-6 rounded border border-gray-300 ${
        twoColumns ? "two-columns" : "one-column"
      } line-container`}
      style={{ 
        whiteSpace: "pre-wrap", 
        height: `${containerHeight}px`,
        backgroundColor: backgroundColor,
        position: 'relative' // Важливо для вірного позиціонування
      }}
    >
      <h2 className="font-bold text-xl title-description-spacing" style={{ color: textColor }}>
        {title}
      </h2>
      <p className="title-description-spacing description-margin-top" style={{ color: textColor }}>
        {description}
      </p>

      {twoColumns ? (
        <div className="flex gap-8">
          <div className="flex-1">
            {leftLines.map((line, i) => (
              <InteractiveDisplayLine 
                key={i} 
                {...line} 
                lineIndex={i}
                onChordMove={onChordMove}
              />
            ))}
          </div>
          <div className="flex-1">
            {rightLines.map((line, i) => (
              <InteractiveDisplayLine 
                key={i + leftLines.length} 
                {...line} 
                lineIndex={i + leftLines.length}
                onChordMove={onChordMove}
              />
            ))}
          </div>
        </div>
      ) : (
        lines.map((line, i) => (
          <InteractiveDisplayLine 
            key={i} 
            {...line} 
            lineIndex={i}
            onChordMove={onChordMove}
          />
        ))
      )}
    </div>
  );
});

export default PreviewSection;
