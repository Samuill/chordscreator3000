import React, { useState, useRef, useEffect, useCallback } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const chordTypes = ["Am", "C", "G", "F"];

const DraggableChord = ({ chord }: { chord: string }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "chord",
    item: { chord, fromAssigned: false },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab",
        backgroundColor: "#4A90E2",
        color: "white",
        padding: "6px 14px",
        borderRadius: 8,
        fontWeight: 700,
        userSelect: "none",
        marginRight: 12,
        boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
        display: "inline-block",
        whiteSpace: "nowrap",
        transition: "opacity 0.2s",
      }}
      title="Перетягніть, щоб призначити акорд"
    >
      {chord}
    </div>
  );
};

const AssignedChord = ({
  chord,
  idx,
  moveAssignedChord,
  removeAssignedChord,
}: {
  chord: string;
  idx: number;
  moveAssignedChord: (fromIdx: number, toIdx: number) => void;
  removeAssignedChord: (idx: number) => void;
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: "chord",
    item: { chord, fromAssigned: true, idx },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  return (
    <div
      ref={drag}
      style={{
        position: "absolute",
        top: -20, // Position above the character
        left: "50%", // Center horizontally over the drop zone
        transform: "translateX(-50%)", // Ensure perfect centering
        cursor: isDragging ? "grabbing" : "grab",
        color: "#8B4513",
        padding: "3px 8px",
        borderRadius: 6,
        fontWeight: 700,
        fontSize: 13,
        whiteSpace: "nowrap",
        userSelect: "none",
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : "auto",
        transition: "opacity 0.2s",
      }}
      title="Перетягніть, щоб перемістити акорд"
    >
      {chord}
    </div>
  );
};

const DropZone = ({
  idx,
  onDropChord,
  assignedChord,
  moveAssignedChord,
  removeAssignedChord,
  coords,
}: {
  idx: number;
  onDropChord: (idx: number, chord: string) => void;
  assignedChord?: string;
  moveAssignedChord: (fromIdx: number, toIdx: number) => void;
  removeAssignedChord: (idx: number) => void;
  coords: { top: number; left: number; width: number };
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "chord",
    drop: (item: any, monitor) => {
      if (!monitor.didDrop()) {
        if (item.fromAssigned) {
          moveAssignedChord(item.idx, idx);
        } else {
          onDropChord(idx, item.chord);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });
  const isActive = isOver && canDrop;
  const style = coords
    ? {
        position: "absolute",
        top: coords.top - 30,
        left: coords.left,
        height: 28,
        width: coords.width,
        pointerEvents: "auto",
        cursor: "pointer",
        borderBottom: isActive ? "2px solid #4A90E2" : "2px solid transparent",
        transition: "border-color 0.2s",
        userSelect: "none",
        zIndex: isActive ? 1001 : "auto",
      }
    : { display: "none" };
  return (
    <div ref={drop} style={style} data-idx={idx}>
      {assignedChord && (
        <AssignedChord
          chord={assignedChord}
          idx={idx}
          moveAssignedChord={moveAssignedChord}
          removeAssignedChord={removeAssignedChord}
        />
      )}
    </div>
  );
};

// Function to convert chord positions based on non-space character indexes.
const convertPositions = (
  oldText: string,
  newText: string,
  oldAssignedChords: { [key: number]: string }
) => {
  const newAssignedChords: { [key: number]: string } = {};

  // Якщо новий текст порожній - зберігаємо всі позиції
  if (newText.trim() === "") {
    return oldAssignedChords;
  }

  // Стара логіка конвертації для випадку з текстом
  const newNonSpaceIndices: number[] = [];
  for (let i = 0; i < newText.length; i++) {
    if (newText[i] !== " ") newNonSpaceIndices.push(i);
  }

  Object.entries(oldAssignedChords).forEach(([oldPosStr, chord]) => {
    const oldPos = Number(oldPosStr);
    if (oldPos < newNonSpaceIndices.length) {
      newAssignedChords[oldPos] = chord;
    }
  });

  return newAssignedChords;
};

const LyricsWithChords = () => {
  const [lyrics, setLyrics] = useState("мені потрібен ти");
  const [chordLine, setChordLine] = useState<string[]>([]); // Array of chord tokens.
  const [assignedChords, setAssignedChords] = useState<{
    [key: number]: string;
  }>({});
  const [rawText, setRawText] = useState(lyrics);
  const [isUpdatingFromDnd, setIsUpdatingFromDnd] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Update the fullText constant to preserve formatting
  const fullText =
    chordLine.length > 0
      ? rawText.includes("[")
        ? rawText
        : `[${chordLine.join(" ")}]${lyrics}`
      : lyrics;

  useEffect(() => {
    if (!isFocused && !isUpdatingFromDnd) {
      setRawText(fullText);
    }
  }, [fullText, isFocused, isUpdatingFromDnd]);

  // Оновлений chars: якщо lyrics порожній, створюємо один "порожній" символ для дропа акорду
  const chars =
    lyrics.length > 0
      ? [...lyrics].map((char, index) => ({
          char,
          isSpace: char === " ",
          index,
        }))
      : [{ char: "", isSpace: false, index: 0 }];

  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [charPositions, setCharPositions] = useState<
    { top: number; left: number; width: number }[]
  >([]);

  const calculatePositions = useCallback(() => {
    const positions: { top: number; left: number; width: number }[] = [];
    charRefs.current.forEach((el, idx) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        positions[idx] = { top: rect.top, left: rect.left, width: rect.width };
      }
    });
    setCharPositions(positions);
  }, []);

  useEffect(() => {
    calculatePositions();
    window.addEventListener("resize", calculatePositions);
    return () => window.removeEventListener("resize", calculatePositions);
  }, [lyrics, calculatePositions]);

  useEffect(() => {
    charRefs.current = charRefs.current.slice(0, lyrics.length);
  }, [lyrics.length]);

  const removeChord = (idx: number) => {
    setIsUpdatingFromDnd(true);
    setAssignedChords((prev) => {
      const copy = { ...prev };
      delete copy[idx];
      return copy;
    });
    setTimeout(() => setIsUpdatingFromDnd(false), 100);
  };

  const onDropChord = (idx: number, chord: string) => {
    if (chordLine.length === 0) {
      const initialTokens = new Array(lyrics.length + 1).fill(" ");
      setChordLine(initialTokens);
    }
    setIsUpdatingFromDnd(true);
    setAssignedChords((prev) => ({ ...prev, [idx]: chord }));
    setTimeout(() => setIsUpdatingFromDnd(false), 100);
  };

  const moveAssignedChord = (fromIdx: number, toIdx: number) => {
    setIsUpdatingFromDnd(true);
    setAssignedChords((prev) => {
      const copy = { ...prev };
      const movedChord = copy[fromIdx];
      delete copy[fromIdx];
      copy[toIdx] = movedChord;
      return copy;
    });
    setTimeout(() => setIsUpdatingFromDnd(false), 100);
  };

  // Updated handleChange function preserving space tokens.
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (isUpdatingFromDnd) return;

    setRawText(newText);

    if (newText.trimStart().startsWith("[")) {
      const endBracket = newText.indexOf("]");
      if (endBracket > -1) {
        const chordPart = newText.substring(1, endBracket).trim();
        const restText = newText.substring(endBracket + 1);

        // Розділяємо акорди по одному або декількох пробілах
        const chords = chordPart.split(/\s+/);
        setChordLine(chords);
        setLyrics(restText);

        // Перерахунок позицій акордів
        setAssignedChords((prevAssignedChords) =>
          convertPositions(lyrics, restText, prevAssignedChords)
        );
      } else {
        setChordLine([]);
        setLyrics(newText);
      }
    } else {
      setChordLine([]);
      setLyrics(newText);
    }
  };

  // Оновлений ефект для chordLine
  useEffect(() => {
    if (Object.keys(assignedChords).length > 0) {
      const maxIndex = Math.max(...Object.keys(assignedChords).map(Number));
      const newChordLine = new Array(maxIndex + 2).fill(" ");

      Object.entries(assignedChords).forEach(([index, chord]) => {
        newChordLine[Number(index)] = chord;
      });

      // Автоматично додаємо пробіли між акордами
      const chordsString = newChordLine
        .join("")
        .replace(/([A-Za-z]+)(?=[A-Za-z])/g, "$1 ");

      setRawText(lyrics ? `[${chordsString}]${lyrics}` : `[${chordsString}]`);
    } else {
      setRawText(lyrics);
    }
  }, [assignedChords, lyrics]);

  // Effect to update chordLine for drag-and-drop preserving internal spaces.
  useEffect(() => {
    if (Object.keys(assignedChords).length > 0) {
      const maxIndex = Math.max(...Object.keys(assignedChords).map(Number));
      const newChordLine = new Array(maxIndex + 2).fill(" ");
      Object.entries(assignedChords).forEach(([index, chord]) => {
        newChordLine[Number(index)] = chord;
      });

      while (newChordLine[newChordLine.length - 1] === " ") {
        newChordLine.pop();
      }

      const chordsString = newChordLine.join("");
      if (chordsString !== chordLine.join("")) {
        setChordLine(newChordLine);
        setRawText(`[${chordsString}]${lyrics}`);
        setIsUpdatingFromDnd(true);
        setTimeout(() => setIsUpdatingFromDnd(false), 100);
      }
    } else {
      setChordLine([]);
      setRawText(lyrics);
    }
  }, [assignedChords, lyrics, chordLine]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerRect(rect);
    }
  }, [lyrics, calculatePositions]);

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: 700,
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        userSelect: "none",
      }}
    >
      <h2 style={{ marginBottom: 12, color: "#333" }}>Введіть текст пісні:</h2>
      <textarea
        value={rawText}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          setRawText(fullText);
        }}
        rows={3}
        style={{
          width: "100%",
          fontSize: 18,
          padding: 12,
          marginBottom: 30,
          borderRadius: 6,
          border: "1px solid #ccc",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          resize: "vertical",
        }}
        placeholder="Введіть текст сюди..."
      />
      <h2 style={{ marginBottom: 12, color: "#333" }}>Доступні акорди:</h2>
      <div style={{ marginBottom: 40, display: "flex", flexWrap: "wrap" }}>
        {chordTypes.map((chord) => (
          <DraggableChord key={chord} chord={chord} />
        ))}
      </div>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          fontSize: 24,
          fontWeight: 600,
          whiteSpace: "pre-wrap",
          lineHeight: 1.3,
          cursor: "default",
          userSelect: "text",
          minHeight: 50,
          border: "1px solid #ddd",
          padding: 10,
          borderRadius: 6,
          backgroundColor: "#fafafa",
        }}
      >
        {chars.map(({ char, isSpace, index }) => (
          <span
            key={index}
            ref={(el) => (charRefs.current[index] = el)}
            style={{
              display: "inline-block",
              position: "relative",
              userSelect: "text",
              width: isSpace ? "0.7em" : "auto",
            }}
          >
            {isSpace ? "\u00A0" : char}
          </span>
        ))}
        {chars.map(({ index }) => {
          // Якщо lyrics порожній, малюємо одну зону для дропа акорду
          if (!containerRect || !charPositions[index]) {
            if (lyrics.length === 0 && index === 0) {
              return (
                <DropZone
                  key="drop-empty"
                  idx={0}
                  onDropChord={onDropChord}
                  assignedChord={assignedChords[0]}
                  moveAssignedChord={moveAssignedChord}
                  removeAssignedChord={removeChord}
                  coords={{ left: 0, top: 0, width: 40 }}
                />
              );
            }
            return null;
          }
          const left = charPositions[index].left - containerRect.left;
          const top = charPositions[index].top - containerRect.top;
          return (
            <DropZone
              key={"drop-" + index}
              idx={index}
              onDropChord={onDropChord}
              assignedChord={assignedChords[index]}
              moveAssignedChord={moveAssignedChord}
              removeAssignedChord={removeChord}
              coords={{ left, top, width: charPositions[index].width }}
            />
          );
        })}
        {lyrics.length > 0 &&
          containerRect &&
          charPositions[lyrics.length - 1] && (
            <DropZone
              key={"drop-" + lyrics.length}
              idx={lyrics.length}
              onDropChord={onDropChord}
              assignedChord={assignedChords[lyrics.length]}
              moveAssignedChord={moveAssignedChord}
              removeAssignedChord={removeChord}
              coords={{
                left:
                  charPositions[lyrics.length - 1].left -
                  containerRect.left +
                  charPositions[lyrics.length - 1].width,
                top: charPositions[lyrics.length - 1].top - containerRect.top,
                width: 20,
              }}
            />
          )}
      </div>
      <div style={{ marginTop: 30, color: "#555", fontSize: 14 }}>
        * Перетягуйте акорди на потрібний символ тексту. Акорди відображаються в
        одному рядку у квадратних дужках (якщо ви їх відкриєте вручну). Якщо
        квадратних дужок немає, текст ведеться нормально.
      </div>
    </div>
  );
};


const App = () => (
  <DndProvider backend={HTML5Backend}>
    <LyricsWithChords />
  </DndProvider>
);

export default App;
