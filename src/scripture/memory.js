// src/scripture/memory.js
//
// WHAT THE SCREEN IS SHOWING, AND WHAT EACH SENTENCE DOES TO IT.
//
// Why this file exists
// --------------------
// hear.js finds a reference in a sentence. That is only half of what the
// pastor does. COMMANDS.md section 2 lists five things he says, and four of
// them only make sense against what is already up: "the next verse",
// "before that, verse 9", "NLT", "let's read that verse again".
//
// So the screen has a memory. It is four things: book, chapter, verse and
// version. Most sentences change one or two of them.
//
// It works on TEXT, so it does not care whether Chrome or Moonshine heard
// the words. Chrome writes "Malachi 3:3", Moonshine writes "Malachi chapter
// three verse three", and by the time they reach here both are the same.
//
// What it must never do
// ---------------------
// DIRECTION.md: never show the wrong verse. So when a sentence is not
// clearly an instruction, nothing changes. A sentence like "in the next verse
// he says" is the pastor preaching, not asking, and it must be left alone.
//
// This file never touches the network, the screen or storage. It takes the
// state in and gives the new state back, which is what makes it testable
// with the plain sentences in scripts/check-memory.mjs.
//
// THE PARTS THAT ARE MY READING, NOT HIS WORDS
// --------------------------------------------
//   - How short a sentence has to be to count as "just the command".
//     Five words after the filler. Tune it from real services.
//   - "that verse again" goes back to the verse shown BEFORE this one. He
//     says it after the screen has moved on, but if it has not moved on this
//     goes one verse too far back. Open question in CURRENT.md.
//   - A chapter with no verse ("Proverbs 22") opens at verse 1.
//
// Sections
// --------
//   1. The versions, and what each is called out loud
//   2. The starting state
//   3. Reading one sentence
//   4. The commands that move around

import { BOOKS } from "./books.js";
import { hearReference, numberAt, tidy } from "./hear.js";

// ---------------------------------------------------------------------------
// 1. The versions, and what each is called out loud
// ---------------------------------------------------------------------------
//
// COMMANDS.md section 2C: he says "NLT" and he says "the living Bible". The
// spoken name and the initials both have to work. A speech engine also
// spells initials out, "N L T", so that form is listed too.
//
// "Passion" and "good news" alone are NOT here, because a pastor says both
// in ordinary preaching. Only the full names count.

export const VERSIONS = [
  { id: "NKJV", name: "New King James Version", said: ["nkjv", "n k j v", "new king james version", "new king james"] },
  { id: "KJV", name: "King James Version", said: ["kjv", "k j v", "king james version", "king james"] },
  { id: "NLT", name: "New Living Translation", said: ["nlt", "n l t", "new living translation", "new living"] },
  { id: "TLB", name: "The Living Bible", said: ["tlb", "t l b", "the living bible", "living bible"] },
  { id: "NIV", name: "New International Version", said: ["niv", "n i v", "new international version", "new international"] },
  { id: "ASV", name: "American Standard Version", said: ["asv", "a s v", "american standard version", "american standard"] },
  { id: "RSV", name: "Revised Standard Version", said: ["rsv", "r s v", "revised standard version", "revised standard"] },
  { id: "GNB", name: "Good News Bible", said: ["gnb", "g n b", "good news bible", "good news translation"] },
  { id: "TPT", name: "The Passion Translation", said: ["tpt", "t p t", "passion translation", "the passion translation"] },
  { id: "AMP", name: "Amplified Bible", said: ["amplified version", "amplified bible", "the amplified", "amplified"] },
];

export const DEFAULT_VERSION = "KJV";

export function versionName(id) {
  const found = VERSIONS.find((one) => one.id === id);
  return found ? found.name : id;
}

// Every spoken form, longest first, so "new king james" is tried before
// "king james" and does not lose its "new".
const SPOKEN_VERSIONS = VERSIONS.flatMap((version) =>
  version.said.map((said) => ({ id: version.id, said })),
).sort((a, b) => b.said.length - a.said.length);

export function findVersion(text) {
  const padded = ` ${tidy(text)} `;
  const hit = SPOKEN_VERSIONS.find((one) => padded.includes(` ${one.said} `));
  return hit ? hit.id : null;
}

// ---------------------------------------------------------------------------
// 2. The starting state
// ---------------------------------------------------------------------------

export function startingScreen() {
  return {
    book: null,
    chapter: null,
    verse: null,
    version: DEFAULT_VERSION,
    // Every position that has been up, oldest first, so "that verse again"
    // has something to go back to. It is never cleared by time, only grown.
    before: [],
  };
}

function position(screen) {
  return { book: screen.book, chapter: screen.chapter, verse: screen.verse };
}

function samePlace(a, b) {
  return a.book === b.book && a.chapter === b.chapter && a.verse === b.verse;
}

function bookByName(name) {
  return BOOKS.find((book) => book.name === name);
}

// ---------------------------------------------------------------------------
// 3. Reading one sentence
// ---------------------------------------------------------------------------
//
// The answer is always the same shape: the screen as it should now be, what
// was done in plain words for the log, and whether anything changed.

const FILLER = new Set([
  "can", "we", "see", "let", "lets", "let's", "the", "a", "please", "go", "to",
  "show", "us", "take", "now", "okay", "ok", "and", "then", "media", "just",
]);

const ASKING = ["see", "show", "media", "take us", "go to", "lets", "let us"];

// A sentence counts as an instruction when it is short, or when it says it
// is one. "The next verse" is short. "In the next verse he says" is long and
// has no asking word, so it is preaching.
function isAnInstruction(words, whole) {
  const padded = ` ${whole} `;
  if (ASKING.some((word) => padded.includes(` ${word} `))) return true;
  const meaningful = words.filter((word) => !FILLER.has(word));
  return meaningful.length <= 5;
}

function stay(screen, why) {
  return { screen, changed: false, did: why };
}

export function understand(text, screen, options = {}) {
  const whole = tidy(text);
  if (!whole) return stay(screen, "heard nothing");
  const words = whole.split(" ");

  const reference = hearReference(text);
  const version = findVersion(text);

  // A named verse is enough on its own. It is the first trigger in
  // COMMANDS.md section 5, and a version said alongside it ("what NLT calls
  // it in Proverbs 5:10") comes along for free.
  if (reference) {
    return goTo(screen, reference, version);
  }

  // Everything below is a command with no reference, so it has to look like
  // one.
  if (!isAnInstruction(words, whole)) {
    return stay(screen, "heard, but it is preaching and not an instruction");
  }

  const moved = moveAround(words, whole, screen, options);
  if (moved) return moved;

  if (version) {
    const next = { ...screen, version };
    return {
      screen: next,
      changed: version !== screen.version,
      did: `changed the version to ${version}`,
    };
  }

  return stay(screen, "no reference and no command");
}

// ---------------------------------------------------------------------------
// 4. The commands that move around
// ---------------------------------------------------------------------------

function goTo(screen, reference, version) {
  const next = {
    book: reference.book,
    chapter: reference.chapter,
    // "Proverbs 22" with no verse opens at verse 1.
    verse: reference.verse || 1,
    version: version || screen.version,
    before: screen.before,
  };
  return arrive(screen, next, `opened ${reference.book} ${next.chapter}:${next.verse}`);
}

// Moves from one place to another and remembers where it was. Standing still
// is not a move, and is not remembered.
function arrive(screen, next, did) {
  const moved = !samePlace(position(screen), position(next));
  const before =
    moved && screen.book ? [...screen.before, position(screen)] : screen.before;
  const versionChanged = next.version !== screen.version;
  return {
    screen: { ...next, before },
    changed: moved || versionChanged,
    did,
  };
}

function moveAround(words, whole, screen, options) {
  const padded = ` ${whole} `;
  const has = (phrase) => padded.includes(` ${phrase} `);

  // The same verse again. COMMANDS.md section 7: it has to survive the
  // screen showing something else, so it reads the memory.
  //
  // It needs the word "verse" or "scripture" beside "again". "Say that again"
  // is a preacher repeating himself, and must never move the screen.
  if (has("again") && (has("verse") || has("scripture"))) {
    const last = screen.before[screen.before.length - 1];
    if (!last) return stay(screen, "nothing to go back to");
    return arrive(
      { ...screen, before: screen.before.slice(0, -1) },
      { ...last, version: screen.version, before: screen.before.slice(0, -1) },
      `went back to ${last.book} ${last.chapter}:${last.verse}`,
    );
  }

  // Nothing below can move if nothing is showing yet.
  if (!screen.book) return null;
  const book = bookByName(screen.book);

  const next = has("next");
  // "Last" is left out on purpose. "The last verse" means the final verse of
  // the chapter as often as it means the one before this.
  const previous = has("previous") || has("before");

  if ((next || previous) && (has("chapter") || has("chapters"))) {
    const step = next ? 1 : -1;
    const chapter = screen.chapter + step;
    if (chapter < 1 || chapter > book.chapters) {
      return stay(screen, "that chapter does not exist, so it stayed");
    }
    return arrive(screen, { ...screen, chapter, verse: 1 }, `moved to chapter ${chapter}`);
  }

  // "before that, verse 9" is a jump inside the chapter that is open, not a
  // new reference, and "verse 9" alone is only believed after "before that"
  // or a word that asks.
  const verseAt = words.indexOf("verse");
  const asked = has("before that") || ASKING.some((word) => has(word));
  if (verseAt !== -1 && asked) {
    const number = numberAt(words, verseAt + 1);
    if (number && number.value >= 1) {
      return setVerse(screen, number.value, options);
    }
  }

  if (next && has("verse")) return setVerse(screen, screen.verse + 1, options);
  if (previous && has("verse")) return setVerse(screen, screen.verse - 1, options);

  return null;
}

// options.versesIn(book, chapter, version) says how many verses a chapter
// has. The Bible text is not loaded yet, so until it is, it is not asked
// and only the lower edge is checked. COMMANDS.md section 7: at the last
// verse "next verse" leaves the screen alone, it never rolls over.
function setVerse(screen, verse, options) {
  if (verse < 1) return stay(screen, "there is no verse before this, so it stayed");

  const count =
    options.versesIn ? options.versesIn(screen.book, screen.chapter, screen.version) : null;
  if (count && verse > count) {
    return stay(screen, "that verse does not exist, so it stayed");
  }

  return arrive(screen, { ...screen, verse }, `moved to verse ${verse}`);
}
