import React, { useRef, useEffect } from 'react';

const LineEditor = React.memo(({ line, index, updateLine, onEnter, focus, onSplit, isSplitPoint }) => {
  const lyricRef = useRef(null);
  
  useEffect(() => {
    if (focus && lyricRef.current) {
      lyricRef.current.focus();
    }
  }, [focus]);

  return (
    <div className="mb-4 relative">
      <input
        type="text"
        placeholder="Акорди (через пробіл)"
        value={line.chords}
        onChange={e => updateLine(index, "chords", e.target.value)}
        className="w-full p-1 mb-1 border border-gray-300 rounded font-bold text-[#6b4f2a]"
        spellCheck="false"
      />
      <input
        ref={lyricRef}
        type="text"
        placeholder="Текст пісні"
        value={line.lyrics}
        onChange={e => updateLine(index, "lyrics", e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter(index);
          }
        }}
        className="w-full p-1 border border-gray-300 rounded"
        spellCheck="false"
      />
      <button
        onClick={() => updateLine(index, "remove", true)}
        className="absolute top-1 right-1 text-red-600 font-bold px-2 py-0.5 rounded hover:bg-red-100"
        aria-label="Видалити рядок"
        type="button"
      >
        &times;
      </button>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onSplit(index)}
          className={`px-4 py-2 rounded font-semibold border ${
            isSplitPoint ? "bg-white text-[#6b4f2a] border-[#6b4f2a]" : "bg-[#6b4f2a] text-white border-[#6b4f2a]"
          }`}
          type="button"
        >
          {isSplitPoint ? "Повернути в один стовпець" : "Перейти на наступний стовпець"}
        </button>
      </div>
      <div className="mt-2">
        <label>
          <input
            type="checkbox"
            checked={line.isStructure || false}
            onChange={e => updateLine(index, "isStructure", e.target.checked)}
          />
          Структура пісні
        </label>
      </div>
    </div>
  );
});

export default LineEditor;
