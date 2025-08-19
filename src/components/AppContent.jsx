import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { useSettings } from '../contexts/SettingsContext';
import LineEditor from './LineEditor';
import SettingsPanel from './SettingsPanel';
import PreviewSection from './PreviewSection';
import InteractiveDisplayLine from './InteractiveDisplayLine';
import { transposeChord } from '../utils/chordTransposer';

const defaultLines = [
  { 
    chordsPositions: [
      { chord: "Am", position: 0, charIndex: 0 },
      { chord: "C", position: 60, charIndex: 5 },
      { chord: "F", position: 120, charIndex: 10 },
      { chord: "G", position: 180, charIndex: 15 }
    ],
    chords: "Am C F G",
    lyrics: "За мене хрест поніс,"
  },
  { 
    chordsPositions: [
      { chord: "C", position: 0, charIndex: 0 }
    ],
    chords: "C",
    lyrics: "І прийняв смерть,"
  },
  { 
    chordsPositions: [
      { chord: "F", position: 0, charIndex: 0 },
      { chord: "Gsus", position: 60, charIndex: 5 },
      { chord: "G", position: 120, charIndex: 10 }
    ],
    chords: "F Gsus G",
    lyrics: "щоб я жив у свободі"
  },
  { 
    chordsPositions: [
      { chord: "C", position: 0, charIndex: 0 },
      { chord: "G", position: 60, charIndex: 5 }
    ],
    chords: "C G",
    lyrics: "Тобі віддам життя,"
  },
  { 
    chordsPositions: [
      { chord: "C", position: 0, charIndex: 0 }
    ],
    chords: "C",
    lyrics: "Прославлю я"
  },
  { 
    chordsPositions: [
      { chord: "F", position: 0, charIndex: 0 },
      { chord: "Gsus", position: 60, charIndex: 5 },
      { chord: "G", position: 120, charIndex: 10 }
    ],
    chords: "F Gsus G",
    lyrics: "Твою милість навіки, Бог!"
  }
];

const AppContent = () => {
  const {
    showChords, setShowChords,
    showLyrics, setShowLyrics,
    twoColumns, setTwoColumns,
    containerWidth,
    lyricSize
  } = useSettings();

  const [lines, setLines] = useState(defaultLines);
  const [focusLine, setFocusLine] = useState(null);
  const [bulkInput, setBulkInput] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [splitIndex, setSplitIndex] = useState(null);
  const [currentTransposition, setCurrentTransposition] = useState(0);
  const exportRef = useRef(null);

  const ensureChordPositions = useCallback((lines) => {
    return lines.map(line => {
      if (!line.chordsPositions && line.chords) {
        const chordArray = line.chords.trim().split(/\s+/);
        const lyrics = line.lyrics || '';
        
        const chordsPositions = chordArray.map((chord, index) => {
          let charIndex = 0;
          if (lyrics.length > 0) {
            const chordCount = chordArray.length;
            if (chordCount > 1) {
              charIndex = Math.min(
                Math.floor((index * lyrics.length) / chordCount),
                lyrics.length - 1
              );
            }
          }
          
          return {
            chord,
            position: index * 80,
            charIndex
          };
        });
        
        return { ...line, chordsPositions };
      }
      
      if (Array.isArray(line.chordsPositions)) {
        return {
          ...line,
          chordsPositions: line.chordsPositions.map((chordPos, index) => {
            if (chordPos.charIndex !== undefined) return chordPos;
            
            const lyrics = line.lyrics || '';
            let charIndex = 0;
            if (lyrics.length > 0) {
              const chordCount = line.chordsPositions.length;
              if (chordCount > 1) {
                charIndex = Math.min(
                  Math.floor((index * lyrics.length) / chordCount),
                  lyrics.length - 1
                );
              }
            }
            
            return { ...chordPos, charIndex };
          })
        };
      }
      
      return line;
    });
  }, []);

  useEffect(() => {
    setLines(prevLines => ensureChordPositions(prevLines));
  }, [ensureChordPositions]);

  useEffect(() => {
    try {
      const storedBulkInput = localStorage.getItem("bulkInput");
      if (storedBulkInput) setBulkInput(storedBulkInput);
    } catch (error) {
      console.error("Помилка завантаження даних з localStorage:", error);
      localStorage.removeItem("bulkInput");
    }
  }, []);

  useEffect(() => {
    try {
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
    } catch (error) {
      console.error("Помилка збереження даних в localStorage:", error);
    }
  }, [lines]);

  useEffect(() => {
    setLines(prev => {
      return prev.map(line => {
        if (!line.chordsPositions || !Array.isArray(line.chordsPositions)) {
          return line;
        }
        return line;
      });
    });
  }, [lyricSize]);

  const updateLine = useCallback((index, field, value) => {
    if (field === "remove") {
      setLines(prev => prev.filter((_, i) => i !== index));
      return;
    }
    
    setLines(prev => prev.map((line, i) => {
      if (i !== index) return line;
      
      const updatedLine = { ...line, [field]: value };
      
      if (field === "chords") {
        const chordArray = value.trim().split(/\s+/);
        updatedLine.chordsPositions = chordArray.map((chord, i) => ({
          chord,
          position: i * 80
        }));
      }
      
      return updatedLine;
    }));
  }, []);

  const addLine = useCallback(() => {
    setLines(prev => [...prev, { chords: "", lyrics: "", chordsPositions: [] }]);
  }, []);

  const insertLineAfter = useCallback(index => {
    const newLine = { chords: "", lyrics: "", chordsPositions: [] };
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
  }, [splitIndex, setTwoColumns]);

  const { leftLines, rightLines } = useMemo(() => {
    const half = Math.ceil(lines.length / 2);
    return {
      leftLines: splitIndex !== null ? lines.slice(0, splitIndex + 1) : lines.slice(0, half),
      rightLines: splitIndex !== null ? lines.slice(splitIndex + 1) : lines.slice(half)
    };
  }, [lines, splitIndex]);

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
        const chordArray = chordStr.trim().split(/\s+/);
        const lyrics = chordMatch[2].trim();
        
        const chordsPositions = chordArray.map((chord, index) => {
          let charIndex = 0;
          if (lyrics.length > 0) {
            const chordCount = chordArray.length;
            if (chordCount > 1) {
              charIndex = Math.min(
                Math.floor((index * lyrics.length) / chordCount),
                lyrics.length - 1
              );
            }
          }
          
          return {
            chord,
            position: index * 80,
            charIndex
          };
        });
        
        result.push({ 
          chords: chordStr, 
          lyrics: lyrics, 
          isStructure, 
          chordsPositions 
        });
      } else {
        const parts = line.split(/\t| {2,}/);
        if (parts.length >= 2) {
          const chordArray = parts[0].trim().split(/\s+/);
          const lyrics = parts.slice(1).join(" ").trim();
          
          const chordsPositions = chordArray.map((chord, index) => {
            let charIndex = 0;
            if (lyrics.length > 0) {
              const chordCount = chordArray.length;
              if (chordCount > 1) {
                charIndex = Math.min(
                  Math.floor((index * lyrics.length) / chordCount),
                  lyrics.length - 1
                );
              }
            }
            
            return {
              chord,
              position: index * 80,
              charIndex
            };
          });
          
          result.push({ chords: parts[0].trim(), lyrics, chordsPositions });
        } else {
          result.push({ chords: "", lyrics: line.trim(), chordsPositions: [] });
        }
      }
    });
    return result;
  };

  const handleChordMove = useCallback((
    fromLineIndex, 
    chordIndex, 
    toLineIndex, 
    charIndex, 
    pixelPosition
  ) => {
    try {
      console.log('Moving chord:', { fromLineIndex, chordIndex, toLineIndex, charIndex, pixelPosition });
      
      setLines(prev => {
        if (fromLineIndex < 0 || fromLineIndex >= prev.length || 
            toLineIndex < 0 || toLineIndex >= prev.length) {
          console.error('Невалідні індекси рядків:', { fromLineIndex, toLineIndex, totalLines: prev.length });
          return prev;
        }
        
        const newLines = [...prev];
        
        const fromLine = newLines[fromLineIndex];
        if (!fromLine.chordsPositions || !Array.isArray(fromLine.chordsPositions)) {
          console.error('Відсутні або невалідні позиції акордів у вихідному рядку:', fromLine);
          return prev;
        }
        
        if (chordIndex < 0 || chordIndex >= fromLine.chordsPositions.length) {
          console.error('Невалідний індекс акорду:', { chordIndex, totalChords: fromLine.chordsPositions.length });
          return prev;
        }
        
        const movedChord = fromLine.chordsPositions[chordIndex];
        const updatedFromPositions = fromLine.chordsPositions.filter((_, i) => i !== chordIndex);
        
        newLines[fromLineIndex] = {
          ...fromLine,
          chordsPositions: updatedFromPositions,
          chords: updatedFromPositions.map(c => c.chord).join(' ')
        };
        
        const toLine = newLines[toLineIndex];
        const targetPositions = Array.isArray(toLine.chordsPositions) ? [...toLine.chordsPositions] : [];
        
        const updatedTargetPositions = [
          ...targetPositions,
          { 
            ...movedChord, 
            position: pixelPosition,
            charIndex: charIndex
          }
        ];
        
        updatedTargetPositions.sort((a, b) => a.position - b.position);
        
        newLines[toLineIndex] = {
          ...toLine,
          chordsPositions: updatedTargetPositions,
          chords: updatedTargetPositions.map(c => c.chord).join(' ')
        };
        
        return newLines;
      });
    } catch (error) {
      console.error('Помилка під час переміщення акорду:', error);
    }
  }, []);

  const transposeAllChords = useCallback((steps) => {
    setLines(prev => prev.map(line => {
      if (!line.chordsPositions || line.chordsPositions.length === 0) return line;
      
      const newChordsPositions = line.chordsPositions.map(chordObj => ({
        ...chordObj,
        chord: transposeChord(chordObj.chord, steps)
      }));
      
      const newChords = newChordsPositions.map(cp => cp.chord).join(' ');
      
      return {
        ...line,
        chordsPositions: newChordsPositions,
        chords: newChords
      };
    }));
    
    setCurrentTransposition(prev => prev + steps);
  }, []);

  // Видаляємо applyBulkInput і кнопку "Застосувати текст"
  // Додаємо ефект для автооновлення lines при зміні bulkInput
  useEffect(() => {
    // Не оновлюємо, якщо bulkInput порожній (щоб не стерти все)
    if (bulkInput.trim() === "") return;
    try {
      const parsed = parseBulkInput(bulkInput);
      // Оновлюємо тільки якщо розпарсений результат відрізняється від поточного lines
      // (щоб уникнути нескінченного циклу)
      const linesStr = JSON.stringify(lines.map(l => ({ chords: l.chords, lyrics: l.lyrics })));
      const parsedStr = JSON.stringify(parsed.map(l => ({ chords: l.chords, lyrics: l.lyrics })));
      if (linesStr !== parsedStr) {
        setLines(parsed);
      }
    } catch (error) {
      // Ігноруємо помилки парсингу
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkInput]);

  return (
    <div className="mx-auto" style={{ maxWidth: containerWidth }}>
      <h1 className="font-extrabold text-2xl mb-6 text-[#3e2f1c]">Редактор акордів і тексту</h1>

      <div className="mb-6">
        <label className="block font-semibold mb-1" htmlFor="title">Назва:</label>
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
        <label className="block font-semibold mb-1" htmlFor="description">Опис:</label>
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
          {/* Кнопку можна видалити або замінити на "Скинути до bulkInput" */}
          {/* <button ...>Застосувати текст</button> */}
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

      <SettingsPanel />

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
        <div className="flex items-center gap-2 border border-gray-300 rounded px-4 py-1">
          <span className="font-semibold text-[#6b4f2a]">Тональність:</span>
          <button
            onClick={() => transposeAllChords(-1)}
            className="px-3 py-1 bg-[#6b4f2a] text-white rounded-l hover:bg-[#5a4120]"
            type="button"
          >
            -1
          </button>
          <span className="font-bold min-w-[30px] text-center">{currentTransposition > 0 ? '+' : ''}{currentTransposition}</span>
          <button
            onClick={() => transposeAllChords(1)}
            className="px-3 py-1 bg-[#6b4f2a] text-white rounded-r hover:bg-[#5a4120]"
            type="button"
          >
            +1
          </button>
          <button
            onClick={() => {
              transposeAllChords(-currentTransposition);
            }}
            className="px-2 py-1 text-[#6b4f2a] hover:bg-gray-100 rounded"
            type="button"
            title="Скинути тональність"
          >
            ↻
          </button>
        </div>
      </div>

      <PreviewSection
        ref={exportRef}
        lines={lines}
        title={title}
        description={description}
        leftLines={leftLines}
        rightLines={rightLines}
        onChordMove={handleChordMove}
      />
    </div>
  );
};

export default AppContent;
