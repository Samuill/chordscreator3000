import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toPng } from 'html-to-image'; // Import html-to-image library

const defaultLines = [
  { chords: "Am C F G", lyrics: "За мене хрест поніс," },
  { chords: "C", lyrics: "І прийняв смерть," },
  { chords: "F Gsus G", lyrics: "щоб я жив у свободі" },
  { chords: "C G", lyrics: "Тобі віддам життя," },
  { chords: "C", lyrics: "Прославлю я" },
  { chords: "F Gsus G", lyrics: "Твою милість навіки, Бог!" }
];

// Мемоізований компонент LineEditor
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

// Мемоізований компонент DisplayLine
const DisplayLine = React.memo(({ chords, lyrics, showChords, showLyrics, chordSize, lyricSize, chordColor, textColor, lineSpacing, chordSpacing, isStructure }) => {
  return (
    <div style={{ marginTop: lineSpacing, marginBottom: lineSpacing }}>
      {(isStructure || showChords) && chords && (
        <div
          className="font-bold mb-0.5 chord-word-spacing"
          style={{ 
            fontSize: chordSize, 
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
        <div style={{ fontSize: lyricSize, whiteSpace: "pre-wrap", color: textColor }}>
          {lyrics}
        </div>
      )}
    </div>
  );
});

function App() {
  const [lines, setLines] = useState(defaultLines);
  const [focusLine, setFocusLine] = useState(null);
  const [showChords, setShowChords] = useState(true);
  const [showLyrics, setShowLyrics] = useState(true);
  const [chordSize, setChordSize] = useState(18);
  const [lyricSize, setLyricSize] = useState(16);
  const [containerWidth, setContainerWidth] = useState(600);
  const [containerHeight, setContainerHeight] = useState(1000);
  const [twoColumns, setTwoColumns] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [splitIndex, setSplitIndex] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");
  const [chordColor, setChordColor] = useState("#6b4f2a");
  const [lineSpacing, setLineSpacing] = useState(10); // Відступ між рядками
  const [chordSpacing, setChordSpacing] = useState(5); // Відступ для акордів
  const exportRef = useRef(null);

  useEffect(() => {
    const storedBulkInput = localStorage.getItem("bulkInput");
    if (storedBulkInput) setBulkInput(storedBulkInput);
  }, []);

  useEffect(() => {
    const serializeLines = () =>
      lines
        .map((line) => {
          let chordText = line.chords;
          if (line.isStructure) chordText = '*' + chordText;
          return `[${chordText}] ${line.lyrics}`;
        })
        .join('\n');
    const serialized = serializeLines();
    setBulkInput(serialized);
    localStorage.setItem("bulkInput", serialized);
  }, [lines]);

  // Оптимізовані колбеки
  const updateLine = useCallback((index, field, value) => {
    if (field === "remove") {
      setLines(prev => prev.filter((_, i) => i !== index));
      return;
    }
    setLines(prev => prev.map((line, i) =>
      i === index ? { ...line, [field]: value } : line
    ));
  }, []);

  const addLine = useCallback(() => {
    setLines(prev => [...prev, { chords: "", lyrics: "" }]);
  }, []);

  const insertLineAfter = useCallback(index => {
    const newLine = { chords: "", lyrics: "" };
    setLines(prev => {
      const newLines = [...prev];
      newLines.splice(index + 1, 0, newLine);
      return newLines;
    });
    setFocusLine(index + 1);
  }, []);

  const handleSplit = useCallback((index) => {
    setSplitIndex(prev => prev === index ? null : index);
    setTwoColumns(prev => prev === true && index === splitIndex ? false : true);
  }, [splitIndex]);

  // Мемоізація розділення на колонки
  const { leftLines, rightLines } = useMemo(() => {
    const half = Math.ceil(lines.length / 2);
    return {
      leftLines: splitIndex !== null ? lines.slice(0, splitIndex + 1) : lines.slice(0, half),
      rightLines: splitIndex !== null ? lines.slice(splitIndex + 1) : lines.slice(half)
    };
  }, [lines, splitIndex]);

  // Оптимізована обробка bulk input
  const applyBulkInput = useCallback(() => {
    try {
      const parsed = parseBulkInput(bulkInput);
      if (parsed.length > 0) {
        setLines(parsed);
        setBulkInput("");
      }
    } catch (error) {
      console.error('Error parsing bulk input:', error);
      // Тут можна додати відображення помилки користувачу
    }
  }, [bulkInput]);

  // Оптимізований експорт
  const exportAsPng = useCallback(() => {
    if (!exportRef.current) return;

    const node = exportRef.current;
    const style = window.getComputedStyle(node);
    
    toPng(node, {
      width: parseInt(style.width, 10) * 2,
      height: parseInt(style.height, 10) * 2,
      style: { transform: "scale(2)", transformOrigin: "top left" }
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `${title || 'exported-content'}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Failed to export as PNG:", err);
        // Тут можна додати відображення помилки користувачу
      });
  }, [title]);

  const parseBulkInput = (text) => {
    const result = [];
    const rawLines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    rawLines.forEach((line) => {
      const chordMatch = line.match(/^\s*\[([^\]]+)\]\s*(.*)$/);
      if (chordMatch) {
        let chordStr = chordMatch[1];
        let isStructure = false;
        if (chordStr.startsWith('*')) {
          isStructure = true;
          chordStr = chordStr.substring(1);
        }
        result.push({ chords: chordStr, lyrics: chordMatch[2].trim(), isStructure });
      } else {
        const parts = line.split(/\t| {2,}/);
        if (parts.length >= 2) {
          result.push({ chords: parts[0].trim(), lyrics: parts.slice(1).join(" ").trim() });
        } else {
          result.push({ chords: "", lyrics: line.trim() });
        }
      }
    });
    return result;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="mx-auto" style={{ maxWidth: containerWidth }}>
        <h1 className="font-extrabold text-2xl mb-6 text-[#3e2f1c]">Редактор акордів і тексту</h1>

        <div className="mb-6">
          <label className="block font-semibold mb-1" htmlFor="title">
            Назва:
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Введіть назву"
          />
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-1" htmlFor="description">
            Опис:
          </label>
          <textarea
            id="description"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded resize-y"
            placeholder="клавіші т. 100 тон А (+2)"
          />
        </div>

        <div className="mb-6 space-y-4">
          <div>
            <label className="block font-semibold mb-1" htmlFor="bulkInput">
              Вставте текст пісні (формат: [акорди] текст або акорди і текст через таб/декілька пробілів)
            </label>
            <textarea
              id="bulkInput"
              rows="6"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded resize-y font-mono"
              placeholder={`Приклад:\n[Am C F G] За мене хрест поніс,\nC І прийняв смерть,\n[F Gsus G] щоб я жив у свободі\n[C G] Тобі віддам життя,\n[C ]Прославлю я\n[F Gsus G ]Твою милість навіки, Бог!`}
            />
            <button
              onClick={applyBulkInput}
              className="mt-2 px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              type="button"
            >
              Застосувати текст
            </button>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="font-bold text-lg mb-3 text-[#3e2f1c]">Редагування рядків</h2>
          {lines.map((line, i) => (
            <LineEditor
              key={i}
              line={line}
              index={i}
              updateLine={updateLine}
              onEnter={insertLineAfter}
              focus={i === focusLine}
              onSplit={handleSplit}
              isSplitPoint={splitIndex === i}
            />
          ))}
        </div>

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
          <div>
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

          <div>
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

          <div>
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

        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={() => setShowChords(!showChords)}
            className={`px-4 py-2 rounded font-semibold border ${showChords ? "bg-[#6b4f2a] text-white border-[#6b4f2a]" : "bg-white text-[#6b4f2a] border-[#6b4f2a]"}`}
            aria-pressed={showChords}
            type="button"
          >
            {showChords ? "Приховати акорди" : "Показати акорди"}
          </button>
          <button
            onClick={() => setShowLyrics(!showLyrics)}
            className={`px-4 py-2 rounded font-semibold border ${showLyrics ? "bg-[#6b4f2a] text-white border-[#6b4f2a]" : "bg-white text-[#6b4f2a] border-[#6b4f2a]"}`}
            aria-pressed={showLyrics}
            type="button"
          >
            {showLyrics ? "Приховати текст" : "Показати текст"}
          </button>
          <button
            onClick={() => setTwoColumns(!twoColumns)}
            className={`px-4 py-2 rounded font-semibold border ${twoColumns ? "bg-[#6b4f2a] text-white border-[#6b4f2a]" : "bg-white text-[#6b4f2a] border-[#6b4f2a]"}`}
            aria-pressed={twoColumns}
            type="button"
          >
            {twoColumns ? "Один стовпець" : "Два стовпці"}
          </button>
          <button
            onClick={addLine}
            className="px-4 py-2 rounded font-semibold border bg-green-600 text-white border-green-600 hover:bg-green-700"
            type="button"
          >
            Додати рядок
          </button>
          <button
            onClick={exportAsPng}
            className="px-4 py-2 rounded font-semibold border bg-blue-600 text-white hover:bg-blue-700"
            type="button"
          >
            Експортувати як PNG
          </button>
          <button
            onClick={() => {
              setLines(prev =>
                prev.map(line => ({
                  ...line,
                  lyrics: "\t" + line.lyrics
                }))
              );
            }}
            className="px-4 py-2 rounded font-semibold border bg-purple-600 text-white hover:bg-purple-700"
            type="button"
          >
            Відступити слова
          </button>
          <button
            onClick={() => {
              setLines(prev =>
                prev.map(line => ({
                  ...line,
                  lyrics: line.lyrics.startsWith("\t") ? line.lyrics.substring(1) : line.lyrics
                }))
              );
            }}
            className="px-4 py-2 rounded font-semibold border bg-orange-600 text-white hover:bg-orange-700"
            type="button"
          >
            Забрати відступ
          </button>
        </div>

        <div
          ref={exportRef}
          className={`p-6 rounded border border-gray-300 ${
            twoColumns ? "two-columns" : "one-column"
          } line-container`}
          style={{ 
            whiteSpace: "pre-wrap", 
            height: `${containerHeight}px`,
            backgroundColor: backgroundColor
          }}
        >
          <h2 className="font-bold text-xl title-description-spacing" style={{ color: textColor }}>{title}</h2>
          <p className="title-description-spacing description-margin-top" style={{ color: textColor }}>{description}</p>

          {twoColumns ? (
            <div className="flex gap-8">
              <div className="flex-1">
                {leftLines.map((line, i) => (
                  <DisplayLine
                    key={i}
                    {...line}
                    showChords={showChords}
                    showLyrics={showLyrics}
                    chordSize={`${chordSize}px`}
                    lyricSize={`${lyricSize}px`}
                    chordColor={chordColor}
                    textColor={textColor}
                    lineSpacing={lineSpacing}
                    chordSpacing={chordSpacing}
                  />
                ))}
              </div>
              <div className="flex-1">
                {rightLines.map((line, i) => (
                  <DisplayLine
                    key={i}
                    {...line}
                    showChords={showChords}
                    showLyrics={showLyrics}
                    chordSize={`${chordSize}px`}
                    lyricSize={`${lyricSize}px`}
                    chordColor={chordColor}
                    textColor={textColor}
                    lineSpacing={lineSpacing}
                    chordSpacing={chordSpacing}
                  />
                ))}
              </div>
            </div>
          ) : (
            lines.map((line, i) => (
              <DisplayLine
                key={i}
                {...line}
                showChords={showChords}
                showLyrics={showLyrics}
                chordSize={`${chordSize}px`}
                lyricSize={`${lyricSize}px`}
                chordColor={chordColor}
                textColor={textColor}
                lineSpacing={lineSpacing}
                chordSpacing={chordSpacing}
              />
            ))
          )}
        </div>
      </div>
    </DndProvider>
  );
}

export default React.memo(App);