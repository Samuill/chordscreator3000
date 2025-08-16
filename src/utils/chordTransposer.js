// Масив усіх тонік в хроматичній послідовності
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Регулярний вираз для розбору акорду на тоніку та решту (суфікс)
const CHORD_REGEX = /^([CDEFGAB][#b]?)(.*)$/;

/**
 * Транспонує один акорд на вказану кількість півтонів
 * @param {string} chord - Акорд для транспонування (наприклад, "Am", "F#", "Csus4")
 * @param {number} steps - Кількість півтонів для транспонування (може бути від'ємним)
 * @returns {string} Транспонований акорд
 */
export function transposeChord(chord, steps) {
  // Якщо це не акорд або акорд не розпізнано, повертаємо без змін
  if (!chord || typeof chord !== 'string') return chord;
  
  // Спочатку перевіряємо чи це бас-нота (після слеша)
  if (chord.includes('/')) {
    const [mainChord, bassNote] = chord.split('/');
    return `${transposeChord(mainChord, steps)}/${transposeChord(bassNote, steps)}`;
  }
  
  // Парсимо акорд на тоніку та суфікс
  const match = chord.match(CHORD_REGEX);
  if (!match) return chord; // Повертаємо оригінал, якщо не розпізнано
  
  const [_, rootNote, suffix] = match;
  
  // Визначаємо, чи використовується бемоль в тоніці
  const useFlats = rootNote.includes('b');
  const noteArray = useFlats ? FLATS : NOTES;
  
  // Знаходимо позицію тоніки в масиві
  let noteIndex = -1;
  for (let i = 0; i < noteArray.length; i++) {
    if (noteArray[i] === rootNote) {
      noteIndex = i;
      break;
    }
  }
  
  if (noteIndex === -1) return chord; // Повертаємо оригінал, якщо тоніку не знайдено
  
  // Вираховуємо нову позицію з урахуванням кількості півтонів
  const newIndex = (noteIndex + steps + 12) % 12;
  
  // Формуємо новий акорд
  return noteArray[newIndex] + suffix;
}
