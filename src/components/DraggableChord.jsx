import React from 'react';
import { useDrag } from 'react-dnd';
import { useSettings } from '../contexts/SettingsContext';

const DraggableChord = ({ chord, lineIndex, chordIndex, position, onDragEnd }) => {
  const { chordSize, chordColor } = useSettings();

  const [{ isDragging }, drag] = useDrag({
    type: 'CHORD',
    item: { 
      chord, 
      lineIndex, 
      chordIndex, 
      originalPosition: position,
      id: `chord-${lineIndex}-${chordIndex}-${chord}`
    },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (dropResult && onDragEnd && Object.keys(dropResult).length > 0) {
        onDragEnd(item, dropResult);
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <span
      ref={drag}
      className="draggable-chord cursor-move"
      style={{
        position: 'absolute',
        left: `${position}px`,
        fontSize: `${chordSize}px`,
        fontFamily: 'monospace',
        fontWeight: 'bold',
        color: chordColor,
        opacity: isDragging ? 0.5 : 1,
        userSelect: 'none',
        zIndex: 10,
        backgroundColor: isDragging ? 'rgba(255,255,255,0.8)' : 'transparent',
        padding: '2px 0',  // Прибрали горизонтальний padding
        borderRadius: '3px',
        border: isDragging ? '1px dashed #ccc' : 'none'
      }}
    >
      {chord}
    </span>
  );
};

export default DraggableChord;
