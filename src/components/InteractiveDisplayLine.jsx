import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import DraggableChord from './DraggableChord';
import DroppableLyrics from './DroppableLyrics';

const InteractiveDisplayLine = React.memo(({ 
  chords, 
  chordsPositions,
  lyrics, 
  isStructure, 
  lineIndex, 
  onChordMove 
}) => {
  const {
    showChords,
    showLyrics,
    lineSpacing,
    chordSpacing,
    lyricSize
  } = useSettings();
  
  // Зберігаємо поточні позиції символів для коректного відображення акордів
  const [charPositions, setCharPositions] = useState([]);
  const lyricRef = useRef(null);
  
  // Обчислюємо позиції символів при кожній зміні розміру тексту
  useEffect(() => {
    // Встановлюємо базові позиції навіть якщо текст порожній
    if (!lyrics || lyrics.length === 0) {
      // Створюємо масив базових позицій для акордів, якщо текст відсутній
      const basePositions = Array.from({ length: 50 }, (_, i) => i * 40);
      setCharPositions(basePositions);
      return;
    }
    
    // Вимірюємо позиції символів незалежно від наявності DOM-елементу
    const measureElementRef = document.createElement('div');
    measureElementRef.style.fontSize = `${lyricSize}px`;
    measureElementRef.style.fontFamily = "'system-ui', sans-serif"; // Дефолтний шрифт
    
    if (lyricRef.current) {
      measureElementRef.style.fontFamily = window.getComputedStyle(lyricRef.current).fontFamily;
    }
    
    measureElementRef.style.visibility = 'hidden';
    measureElementRef.style.position = 'absolute';
    measureElementRef.style.whiteSpace = 'pre';
    measureElementRef.style.left = '-9999px';
    document.body.appendChild(measureElementRef);
    
    const positions = [];
    
    // Вимірюємо ширину кожного символу тексту для точного позиціонування
    for (let i = 0; i <= lyrics.length; i++) {
      measureElementRef.textContent = lyrics.substring(0, i);
      positions.push(measureElementRef.getBoundingClientRect().width);
    }
    
    setCharPositions(positions);
    document.body.removeChild(measureElementRef);
    
  }, [lyrics, lyricSize]);

  // Оновлена логіка для обчислення позицій акордів з пріоритетом для charIndex
  const chordPositions = useMemo(() => {
    // Перевірка наявності акордів
    if (!Array.isArray(chordsPositions) || chordsPositions.length === 0) {
      if (!chords) return [];
      
      try {
        const chordArray = (typeof chords === 'string') ? chords.trim().split(/\s+/) : [];
        return chordArray.map((chord, index) => {
          // Генеруємо базові позиції для нових акордів
          const charIndex = Math.min(index * 3, Math.max((lyrics?.length || 1) - 1, 0));
          return {
            chord,
            position: index * 80,
            charIndex
          };
        });
      } catch (error) {
        console.error('Помилка при обробці акордів:', error);
        return [];
      }
    }
    
    // Якщо є позиції символів і акорди мають charIndex, оновлюємо позиції
    if (charPositions.length > 0) {
      return chordsPositions.map(chordData => {
        // Спробуємо використати charIndex для позиціонування
        if (chordData.charIndex !== undefined) {
          // Переконуємось, що charIndex в межах довжини тексту або базових позицій
          const safeCharIndex = Math.min(
            chordData.charIndex, 
            charPositions.length - 1
          );
          
          return {
            ...chordData,
            position: charPositions[safeCharIndex] || chordData.position
          };
        }
        
        // Якщо немає charIndex, залишаємо позицію як є
        return chordData;
      });
    }
    
    // Якщо немає нових позицій символів, залишаємо акорди як є
    return chordsPositions;
  }, [chords, chordsPositions, charPositions, lyrics]);

  // Додаємо функцію handleChordDrop, яка була відсутня
  const handleChordDrop = (draggedItem, dropResult) => {
    if (onChordMove && draggedItem && dropResult) {
      console.log('Chord dropped:', { draggedItem, dropResult });
      onChordMove(
        draggedItem.lineIndex,
        draggedItem.chordIndex,
        dropResult.lineIndex,
        dropResult.charIndex,
        dropResult.pixelPosition
      );
    }
  };

  // Завжди показувати область для акордів, навіть якщо текст порожній
  return (
    <div 
      style={{ 
        marginTop: lineSpacing, 
        marginBottom: lineSpacing,
        position: 'relative',
        minHeight: showChords ? '60px' : 'auto'
      }}
    >
      {/* Область для акордів */}
      {(isStructure || showChords) && chordPositions.length > 0 && (
        <div
          style={{
            position: 'relative',
            height: '30px',
            marginBottom: chordSpacing
          }}
        >
          {chordPositions.map((chordData, index) => (
            <DraggableChord
              key={`chord-${lineIndex}-${index}-${chordData.chord}`}
              chord={chordData.chord}
              lineIndex={lineIndex}
              chordIndex={index}
              position={chordData.position}
              onDragEnd={handleChordDrop} // Використовуємо нашу функцію
            />
          ))}
        </div>
      )}

      {/* Область для тексту з можливістю drop - завжди показувати для дропу */}
      <DroppableLyrics
        ref={lyricRef}
        key={`lyrics-${lineIndex}`}
        lyrics={lyrics}
        lineIndex={lineIndex}
        onChordDrop={handleChordDrop} // Використовуємо нашу функцію
        isEmpty={!lyrics || lyrics.length === 0}
      />
    </div>
  );
});

export default InteractiveDisplayLine;
