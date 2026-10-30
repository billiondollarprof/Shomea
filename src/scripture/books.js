// src/scripture/books.js
//
// THE 66 BOOKS, AND EVERY WAY A PREACHER SAYS THEM.
//
// Why this file is a list and not a clever algorithm
// --------------------------------------------------
// Anthony, 2026-10-30: "no 2 books in the Bible sound alike."
//
// He is right, and it is what makes this whole approach safe. Matching a
// mis-heard word against 66 names would be dangerous if two of them were
// close. None are. So a loose match is still an unambiguous one.
//
// THE NUMBERED BOOKS
// ------------------
// "first John, second John, third John. Those are editions... But if it
// not say first, it just says John, it means we are talking about the
// account of Jesus Christ, John."
//
// So the number in front is part of the name, and its absence is also
// information. Both are handled here rather than guessed at later.
//
// WHAT GOES IN "heard"
// --------------------
// Not alternative spellings. **Things a speech model actually produced, or
// plausibly will.** Every entry taken from a real log is marked with the
// date it was heard. Add to it from `COMMANDS.md` as services happen.
//
// Write the mishearing BOTH ways when it swallows a small word: "an
// anakai" is what was said, and "anakai" is what the matcher sees after it
// has taken the filler words out. Malachi failed its test for exactly
// this reason.
//
// Sections
// --------
//   1. How a spoken number in front is written
//   2. The books

// ---------------------------------------------------------------------------
// 1. How a spoken number in front is written
// ---------------------------------------------------------------------------
//
// A preacher says "first Corinthians", never "one Corinthians", but a
// speech model may type either, and may type the digit.

export const ORDINALS = {
  1: ["first", "1st", "one", "1", "i"],
  2: ["second", "2nd", "two", "2", "ii"],
  3: ["third", "3rd", "three", "3", "iii"],
};

// ---------------------------------------------------------------------------
// 2. The books
// ---------------------------------------------------------------------------
//
//   name     what goes on the screen
//   number   1, 2 or 3 where the name has one, otherwise absent
//   stem     the part after the number, which is what gets sound matched
//   chapters how many it has, so an impossible chapter can be refused
//   heard    real or likely mishearings

export const BOOKS = [
  // --- Old Testament ------------------------------------------------------
  { name: "Genesis", stem: "genesis", chapters: 50, heard: ["genesis", "jenesis"] },
  { name: "Exodus", stem: "exodus", chapters: 40, heard: ["exodus", "exodous"] },
  { name: "Leviticus", stem: "leviticus", chapters: 27, heard: ["leviticus", "levitikus"] },
  { name: "Numbers", stem: "numbers", chapters: 36, heard: ["numbers"] },
  { name: "Deuteronomy", stem: "deuteronomy", chapters: 34, heard: ["deuteronomy", "due to ronomy"] },
  { name: "Joshua", stem: "joshua", chapters: 24, heard: ["joshua", "josh wa"] },
  { name: "Judges", stem: "judges", chapters: 21, heard: ["judges"] },
  { name: "Ruth", stem: "ruth", chapters: 4, heard: ["ruth", "roof"] },
  { name: "1 Samuel", number: 1, stem: "samuel", chapters: 31, heard: ["samuel", "sam you el"] },
  { name: "2 Samuel", number: 2, stem: "samuel", chapters: 24, heard: ["samuel"] },
  { name: "1 Kings", number: 1, stem: "kings", chapters: 22, heard: ["kings"] },
  { name: "2 Kings", number: 2, stem: "kings", chapters: 25, heard: ["kings"] },
  { name: "1 Chronicles", number: 1, stem: "chronicles", chapters: 29, heard: ["chronicles", "chronicals"] },
  { name: "2 Chronicles", number: 2, stem: "chronicles", chapters: 36, heard: ["chronicles"] },
  { name: "Ezra", stem: "ezra", chapters: 10, heard: ["ezra", "esra"] },
  { name: "Nehemiah", stem: "nehemiah", chapters: 13, heard: ["nehemiah", "nehmiah"] },
  { name: "Esther", stem: "esther", chapters: 10, heard: ["esther", "ester"] },
  { name: "Job", stem: "job", chapters: 42, heard: ["job", "jobe"] },
  { name: "Psalms", stem: "psalms", chapters: 150, heard: ["psalms", "psalm", "sams", "salms"] },
  // "Provide" is from Anthony's phone, 2026-09-16.
  { name: "Proverbs", stem: "proverbs", chapters: 31, heard: ["proverbs", "provide", "proverb"] },
  { name: "Ecclesiastes", stem: "ecclesiastes", chapters: 12, heard: ["ecclesiastes", "ecclesiastic"] },
  { name: "Song of Solomon", stem: "song of solomon", chapters: 8, heard: ["song of solomon", "songs of solomon", "song of songs"] },
  { name: "Isaiah", stem: "isaiah", chapters: 66, heard: ["isaiah", "i say a"] },
  { name: "Jeremiah", stem: "jeremiah", chapters: 52, heard: ["jeremiah", "jermiah"] },
  { name: "Lamentations", stem: "lamentations", chapters: 5, heard: ["lamentations"] },
  { name: "Ezekiel", stem: "ezekiel", chapters: 48, heard: ["ezekiel", "ezekial"] },
  { name: "Daniel", stem: "daniel", chapters: 12, heard: ["daniel"] },
  { name: "Hosea", stem: "hosea", chapters: 14, heard: ["hosea", "hoseya"] },
  { name: "Joel", stem: "joel", chapters: 3, heard: ["joel"] },
  { name: "Amos", stem: "amos", chapters: 9, heard: ["amos"] },
  { name: "Obadiah", stem: "obadiah", chapters: 1, heard: ["obadiah"] },
  { name: "Jonah", stem: "jonah", chapters: 4, heard: ["jonah", "jona"] },
  { name: "Micah", stem: "micah", chapters: 7, heard: ["micah", "mica"] },
  { name: "Nahum", stem: "nahum", chapters: 3, heard: ["nahum", "name"] },
  { name: "Habakkuk", stem: "habakkuk", chapters: 3, heard: ["habakkuk", "habakuk"] },
  { name: "Zephaniah", stem: "zephaniah", chapters: 3, heard: ["zephaniah"] },
  { name: "Haggai", stem: "haggai", chapters: 2, heard: ["haggai", "hagai"] },
  { name: "Zechariah", stem: "zechariah", chapters: 14, heard: ["zechariah", "zecharia"] },
  // "an Anakai" is Anthony's own example, 2026-10-30.
  { name: "Malachi", stem: "malachi", chapters: 4, heard: ["malachi", "an anakai", "anakai", "malaki"] },

  // --- New Testament ------------------------------------------------------
  { name: "Matthew", stem: "matthew", chapters: 28, heard: ["matthew", "mathew"] },
  { name: "Mark", stem: "mark", chapters: 16, heard: ["mark"] },
  { name: "Luke", stem: "luke", chapters: 24, heard: ["luke", "look"] },
  { name: "John", stem: "john", chapters: 21, heard: ["john", "jon"] },
  { name: "Acts", stem: "acts", chapters: 28, heard: ["acts", "axe"] },
  { name: "Romans", stem: "romans", chapters: 16, heard: ["romans", "roman"] },
  { name: "1 Corinthians", number: 1, stem: "corinthians", chapters: 16, heard: ["corinthians", "corinthian"] },
  { name: "2 Corinthians", number: 2, stem: "corinthians", chapters: 13, heard: ["corinthians"] },
  { name: "Galatians", stem: "galatians", chapters: 6, heard: ["galatians", "galations"] },
  // "a fee shins" is from the research notes, 2026-09-16.
  { name: "Ephesians", stem: "ephesians", chapters: 6, heard: ["ephesians", "a fee shins", "efesians"] },
  { name: "Philippians", stem: "philippians", chapters: 4, heard: ["philippians", "phillipians"] },
  { name: "Colossians", stem: "colossians", chapters: 4, heard: ["colossians", "colosians"] },
  { name: "1 Thessalonians", number: 1, stem: "thessalonians", chapters: 5, heard: ["thessalonians", "thesalonians"] },
  { name: "2 Thessalonians", number: 2, stem: "thessalonians", chapters: 3, heard: ["thessalonians"] },
  { name: "1 Timothy", number: 1, stem: "timothy", chapters: 6, heard: ["timothy"] },
  { name: "2 Timothy", number: 2, stem: "timothy", chapters: 4, heard: ["timothy"] },
  // "Diters" and "Like toast" are both from Anthony's phone, 2026-09-16.
  { name: "Titus", stem: "titus", chapters: 3, heard: ["titus", "diters", "like toast", "toast", "tightest"] },
  { name: "Philemon", stem: "philemon", chapters: 1, heard: ["philemon", "philemen"] },
  { name: "Hebrews", stem: "hebrews", chapters: 13, heard: ["hebrews", "he bruise"] },
  { name: "James", stem: "james", chapters: 5, heard: ["james"] },
  { name: "1 Peter", number: 1, stem: "peter", chapters: 5, heard: ["peter"] },
  { name: "2 Peter", number: 2, stem: "peter", chapters: 3, heard: ["peter"] },
  { name: "1 John", number: 1, stem: "john", chapters: 5, heard: ["john"] },
  { name: "2 John", number: 2, stem: "john", chapters: 1, heard: ["john"] },
  { name: "3 John", number: 3, stem: "john", chapters: 1, heard: ["john"] },
  { name: "Jude", stem: "jude", chapters: 1, heard: ["jude", "jewed"] },
  { name: "Revelation", stem: "revelation", chapters: 22, heard: ["revelation", "revelations"] },
];

// A book with no number is the plain one. Anthony: "if it not say first,
// it just says John, it means we are talking about the account of Jesus
// Christ, John."
export function plainBook(stem) {
  return BOOKS.find((book) => book.stem === stem && !book.number);
}
