// src/shared/readingList.js
//
// THE LIST TO READ ALOUD, SO A LISTENING TEST HAS AN ANSWER.
//
// Why this file exists
// --------------------
// A log of what the app heard cannot be scored on its own. Nobody remembers
// every verse they said, and Anthony said so himself ("even myself, I don't
// remember some of the things"). Without knowing what was said there is no
// accuracy figure, only a feeling.
//
// So the test is a fixed list. Read it aloud, in order, with a pause between
// lines. scripts/score-log.mjs then compares what was shown against what was
// on the list and gives a real number.
//
// How it is built
// ---------------
// "say" is the words to read, in the way his pastor says them. "expect" is
// the verse that should open. A line with expect: null is ordinary preaching
// that must open NOTHING. Those lines are in the list on purpose, because
// DIRECTION.md says never show the wrong verse and a test that only asks
// for verses cannot catch that.
//
// The books are chosen from the ones that have already gone wrong: the
// numbered ones (1 John, 3 John), the one chapter books (Obadiah, Jude), and
// the short names (Amos, Nahum, Jude) that sound like ordinary words.
//
// What it must never do
// ---------------------
// It is only read on /dev. It is never shown on the church screen.
//
// scripts/check-scoring.mjs proves every "say" line is understood when heard
// perfectly. If one is not, the list is wrong and not the app.

const ask = (say, book, chapter, verse) => ({
  say,
  expect: { book, chapter, verse },
});

// Ordinary preaching. It has numbers and names in it, and nothing here is a
// reference.
const preach = (say) => ({ say, expect: null });

export const READING_LIST = [
  ask("Genesis chapter one, verse one", "Genesis", 1, 1),
  ask("Psalm twenty three, verse one", "Psalms", 23, 1),
  preach("We have been in this house for twenty years"),
  ask("Proverbs chapter three, verse five", "Proverbs", 3, 5),
  ask("Ecclesiastes chapter four, verse four", "Ecclesiastes", 4, 4),
  ask("Song of Solomon chapter two, verse one", "Song of Solomon", 2, 1),
  ask("Isaiah chapter fifty three, verse five", "Isaiah", 53, 5),
  preach("I want you to turn to your neighbour and say well done"),
  ask("Nahum chapter one, verse seven", "Nahum", 1, 7),
  ask("Habakkuk chapter two, verse two", "Habakkuk", 2, 2),
  ask("Malachi chapter three, verse ten", "Malachi", 3, 10),
  ask("Matthew chapter six, verse thirty three", "Matthew", 6, 33),
  ask("John chapter three, verse sixteen", "John", 3, 16),
  preach("God did it two times for me and he will do it again"),
  ask("Romans chapter eight, verse twenty eight", "Romans", 8, 28),
  ask("Philippians chapter four, verse thirteen", "Philippians", 4, 13),
  ask("James chapter one, verse two", "James", 1, 2),
  ask("Obadiah verse three", "Obadiah", 1, 3),
  ask("Jude verse three", "Jude", 1, 3),
  preach("Some fifty people came to the meeting last week"),
  ask("First Samuel chapter seventeen, verse forty five", "1 Samuel", 17, 45),
  ask("Second Kings chapter five, verse fourteen", "2 Kings", 5, 14),
  ask("First Chronicles chapter four, verse ten", "1 Chronicles", 4, 10),
  ask("First Corinthians chapter thirteen, verse four", "1 Corinthians", 13, 4),
  ask("First Thessalonians chapter five, verse sixteen", "1 Thessalonians", 5, 16),
  preach("He gave me three children and two cars"),
  ask("Second Timothy chapter three, verse sixteen", "2 Timothy", 3, 16),
  ask("First Peter chapter five, verse seven", "1 Peter", 5, 7),
  ask("Second Peter chapter three, verse nine", "2 Peter", 3, 9),
  ask("First John chapter four, verse eight", "1 John", 4, 8),
  ask("Second John verse six", "2 John", 1, 6),
  ask("Third John verse two", "3 John", 1, 2),
  ask("Zephaniah chapter three, verse seventeen", "Zephaniah", 3, 17),
];
