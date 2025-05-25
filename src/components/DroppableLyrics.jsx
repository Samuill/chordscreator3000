import React, { forwardRef, useRef, useEffect, useState, useLayoutEffect } from 'react';
import { useDrop } from 'react-dnd';
import { useSettings } from '../contexts/SettingsContext';

const DroppableLyrics = forwardRef(({ lyrics, lineIndex, onChordDrop, isEmpty }, ref) => {
  const { lyricSize, textColor } = useSettings();
  const textRef = useRef(null);
  const [charPositions, setCharPositions] = useState([]);
  const measurementsRef = useRef(null);

  // Використовуємо useLayoutEffect для вимірювань DOM
  useLayoutEffect(() => {
    if (!textRef.current) return;
    
    // Створюємо прихований елемент для вимірювання, щоб не маніпулювати DOM напряму
    if (!measurementsRef.current) {
      measurementsRef.current = document.createElement('div');
      measurementsRef.current.style.visibility = 'hidden';
      measurementsRef.current.style.position = 'absolute';
      measurementsRef.current.style.pointerEvents = 'none';
      measurementsRef.current.style.left = '-9999px';
      document.body.appendChild(measurementsRef.current);
    }

    const element = textRef.current;
    const computedStyle = window.getComputedStyle(element);
    
    // Якщо текст порожній, створюємо базові позиції для можливості дропу акордів
    if (!lyrics || lyrics.length === 0) {
      const basePositions = Array.from({ length: 50 }, (_, i) => i * 40);
      setCharPositions(basePositions);
      return;
    }
    
    const text = lyrics || '';
    const positions = [];
    
    // Налаштовуємо елемент вимірювання з тими ж стилями
    measurementsRef.current.style.fontSize = `${lyricSize}px`;
    measurementsRef.current.style.fontFamily = computedStyle.fontFamily;
    measurementsRef.current.style.fontWeight = computedStyle.fontWeight;
    measurementsRef.current.style.letterSpacing = computedStyle.letterSpacing;
    measurementsRef.current.style.whiteSpace = 'pre';
    
    // Безпечно обчислюємо позиції
    for (let i = 0; i <= text.length; i++) {
      measurementsRef.current.textContent = text.substring(0, i);
      positions.push(measurementsRef.current.getBoundingClientRect().width);
    }
    
    setCharPositions(positions);
    
    // Очищуємо вимірювальний елемент після завершення
    return () => {
      if (measurementsRef.current && document.body.contains(measurementsRef.current)) {
        document.body.removeChild(measurementsRef.current);
        measurementsRef.current = null;
      }
    };
  }, [lyrics, lyricSize]);

  const [{ isOver }, drop] = useDrop({
    accept: 'CHORD',
    drop: (item, monitor) => {
      const dropPosition = monitor.getClientOffset();
      if (!dropPosition || !textRef.current) return {};
      
      const elementRect = textRef.current.getBoundingClientRect();
      const relativeX = dropPosition.x - elementRect.left;
      
      // Перевіримо, чи є charPositions доступним
      if (!charPositions || charPositions.length === 0) {
        console.warn('Позиції символів не обчислені');
        return {
          lineIndex,
          charIndex: 0,
          pixelPosition: 0
        };
      }
      
      // Знаходимо найближчу позицію символу
      let closestCharIndex = 0;
      let minDistance = Math.abs(relativeX - 0);
      
      charPositions.forEach((pos, index) => {
        const distance = Math.abs(relativeX - pos);
        if (distance < minDistance) {
          minDistance = distance;
          closestCharIndex = index;
        }
      });

      return {
        lineIndex,
        charIndex: closestCharIndex,
        pixelPosition: charPositions[closestCharIndex] || 0
      };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Встановлюємо зовнішній ref
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(textRef.current);
      } else {
        ref.current = textRef.current;
      }
    }
  }, [ref]);

  return (
    <div
      ref={(node) => {
        textRef.current = node;
        drop(node);
      }}
      style={{
        fontSize: `${lyricSize}px`,
        color: textColor,
        whiteSpace: 'pre-wrap',
        position: 'relative',
        backgroundColor: isOver ? 'rgba(107, 79, 42, 0.1)' : 'transparent',
        transition: 'background-color 0.2s',
        minHeight: isEmpty ? '2em' : '1.2em',  // Збільшуємо мінімальну висоту для порожніх рядків
        padding: '2px 0',
        width: '100%'  // Забезпечуємо повну ширину для можливості дропу
      }}
    >
      {lyrics || (isOver ? '' : '\u00A0')} {/* Додаємо невидимий простір для порожніх рядків */}
      {isOver && charPositions.map((pos, index) => (
        <div
          key={`charpos-${index}`}
          style={{
            position: 'absolute',
            left: `${pos}px`,
            top: 0,
            width: '1px',
            height: '100%',
            backgroundColor: 'rgba(107, 79, 42, 0.3)',
            pointerEvents: 'none'
          }}
        />
      ))}
    </div>
  );
});

export default DroppableLyrics;
