// src/scripture/hear.js
//
// TURNS WHAT THE MODEL HEARD INTO A BIBLE REFERENCE, OR INTO NOTHING.
//
// The rule this file exists to keep
// ---------------------------------
// `DIRECTION.md`: never show the wrong verse. So this returns nothing far
// more often than it returns something, and every threshold here is set
// from that direction. **When it is unsure, it says nothing.**
//
// Why sound and not spelling
// --------------------------
// The model does not type what was said. Real examples, all from Anthony's
// own phone:
//
//     "Diters"        Titus
//     "Provide"       Proverbs
//     "an Anakai"     Malachi
//     "a fee shins"   Ephesians
//
// Spelling cannot reach any of those. Sound can, and it is safe here for a
// reason Anthony spotted: **no two books of the Bible sound alike**, so a
// loose match is still an unambiguous one.
//
// The two signals, and why both
// -----------------------------
//   1. **A book name, by sound.** Loose on its own.
//   2. **A number right after it.** This is what makes it a reference.
//
// Anthony: "using sound plus qualifying it to the verse". A number with no
// book in front of it is noise, which is why "Best number line" was
// correctly ignored and must stay ignored.
//
// Sections
// --------
//   1. Tidying what was heard
//   2. What a word sounds like
//   3. How close two sounds are
//   4. Finding the numbers
//   5. Finding the book
//   6. Putting it together

import { BOOKS, ORDINALS } from "./books.js";

// ---------------------------------------------------------------------------
// 1. Tidying what was heard
// ---------------------------------------------------------------------------

// Chrome writes a reference the way a Bible prints it, "Malachi 3:3", with
// a colon between chapter and verse. Moonshine writes it as words. The colon
// is turned into a space so both arrive as the same two numbers. Found
// 2026-10-30 from Anthony's first Chrome log: 7 of 10 such lines were being
// thrown away.
export function tidy(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/(\d)\s*:\s*(\d)/g, "$1 $2")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// 2. What a word sounds like
// ---------------------------------------------------------------------------
//
// A small sound encoder. Not a famous one, because the famous ones carry
// rules for names and places this will never meet, and because a short one
// that can be read and corrected beats a long one that cannot.
//
// It keeps the first letter, throws away the vowels after it, and folds
// together the letters English spells differently but says the same.

export function sounds(word) {
  let w = String(word || "").toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return "";

  // Silent beginnings.
  w = w.replace(/^(kn|gn|pn|wr)/, (m) => m[1]);
  w = w.replace(/^ps/, "s");
  w = w.replace(/^x/, "s");

  // Letters that lie about themselves.
  w = w
    .replace(/ough/g, "f")
    .replace(/ph/g, "f")
    .replace(/gh/g, "")
    .replace(/ck/g, "k")
    .replace(/sch/g, "sk")
    .replace(/ch/g, "k")
    .replace(/sh/g, "s")
    .replace(/th/g, "t")
    .replace(/ti(?=[aeiou])/g, "s")
    .replace(/ci(?=[aeiou])/g, "s")
    .replace(/c(?=[eiy])/g, "s")
    .replace(/c/g, "k")
    .replace(/q/g, "k")
    .replace(/x/g, "ks")
    .replace(/z/g, "s")
    .replace(/j/g, "j")
    .replace(/v/g, "f")
    .replace(/w(?=[^aeiou]|$)/g, "")
    .replace(/h(?!^)/g, "");

  const first = w[0];
  const rest = w.slice(1).replace(/[aeiouy]/g, "");
  let key = first + rest;

  // Nobody says a letter twice.
  key = key.replace(/(.)\1+/g, "$1");
  return key;
}

export function soundsOfPhrase(phrase) {
  return tidy(phrase).split(" ").map(sounds).join("");
}

// ---------------------------------------------------------------------------
// 3. How close two sounds are
// ---------------------------------------------------------------------------

function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

// 1 is identical, 0 is nothing alike.
export function closeness(a, b) {
  if (!a || !b) return 0;
  const longest = Math.max(a.length, b.length);
  return 1 - editDistance(a, b) / longest;
}

// ---------------------------------------------------------------------------
// 4. Finding the numbers
// ---------------------------------------------------------------------------

const SPOKEN_NUMBERS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90, hundred: 100,
};

export function asNumber(word) {
  if (/^\d+$/.test(word)) return Number.parseInt(word, 10);
  if (Object.prototype.hasOwnProperty.call(SPOKEN_NUMBERS, word)) {
    return SPOKEN_NUMBERS[word];
  }
  return null;
}

// "twenty one" is two words and one number.
export function numberAt(words, at) {
  const first = asNumber(words[at]);
  if (first === null) return null;

  if (first >= 20 && first <= 90 && first % 10 === 0) {
    const second = asNumber(words[at + 1]);
    if (second !== null && second < 10) {
      return { value: first + second, used: 2 };
    }
  }
  return { value: first, used: 1 };
}

// ---------------------------------------------------------------------------
// 5. Finding the book
// ---------------------------------------------------------------------------
//
// Everything before the first number is the candidate. The last few words
// of it are tried, longest first, because "song of solomon" is three words
// and "john" is one.

// WORDS THAT ARE NEVER PART OF A BOOK NAME.
//
// The first test run failed thirteen ways and most of them were this: the
// candidate for "Hebrews chapter one" was "hebrews chapter", which matches
// nothing, so a real reference was thrown away.
//
// These are stripped out of the candidate before anything is scored. They
// are the words a preacher wraps a reference in.
const FILLER = new Set([
  "the", "a", "an", "of", "to", "in", "at", "on", "and", "that", "this",
  "book", "chapter", "chapters", "verse", "verses", "number", "numbers",
  "turn", "turning", "open", "opened", "opening", "read", "reading",
  "look", "looking", "see", "lets", "let", "us", "we", "you", "i", "me",
  "go", "going", "want", "now", "please", "media", "somebody", "shall",
  "is", "it", "its", "was", "are", "be", "will", "would", "can", "could",
]);

// "Numbers" is a real book and "number" is filler. The only way to tell is
// that nobody says "the book of number". So a stripped word is put back
// when it is the ONLY thing left and it spells a book exactly.
// Note the plural. Nobody says "the book of number", but everybody says
// "number one", and "That's number one" became Numbers 1 on the first run.
const FILLER_THAT_IS_ALSO_A_BOOK = new Set(["numbers", "acts"]);

const MOST_WORDS_IN_A_NAME = 3;

// Below this, it is not a book. Set from DIRECTION.md: silence beats a
// wrong verse.
const GOOD_ENOUGH = 0.62;

// And it has to be clearly better than whatever came second.
const CLEAR_OF_SECOND = 0.08;

function scoreAgainst(candidate, book) {
  const candidateSound = soundsOfPhrase(candidate);
  let best = 0;

  // The real name, and every way it has actually been misheard.
  const tries = [book.stem, ...(book.heard || [])];
  tries.forEach((one) => {
    const tidied = tidy(one);
    if (tidy(candidate) === tidied) {
      best = 1;
      return;
    }

    const bySound = closeness(candidateSound, soundsOfPhrase(one));
    const bySpelling = closeness(tidy(candidate), tidied);

    // Sound leads, because the model types what it thought it heard.
    // Spelling supports, because a word spelled right was usually heard
    // right as well.
    let score = bySound * 0.7 + bySpelling * 0.3;

    // A short name matches loosely against anything. "Amos" won eight
    // tests it had no business in. So a name under five letters has to be
    // closer to earn the same score.
    if (tidied.replace(/\s/g, "").length < 5 && score < 0.95) {
      score *= 0.8;
    }

    if (score > best) best = score;
  });

  return best;
}

// A book name is never followed straight into its number by one of these.
// "Verse nine of that psalm is one I love" has "psalm is" right before the
// "one", and "psalm is" sounds like "Psalms", so it opened Psalms 1. A
// sentence that runs "name, small word, number" is somebody talking, not a
// reference. Found 2026-10-30 by scripts/check-memory.mjs.
const NEVER_ENDS_A_NAME = new Set([
  "is", "was", "are", "were", "be", "been", "am", "i", "you", "he", "she",
  "it", "we", "they", "my", "your", "his", "her", "our", "their", "has",
  "have", "had", "do", "does", "did", "will", "would", "can", "could",
]);

export function findBook(words, upTo) {
  const results = [];

  if (NEVER_ENDS_A_NAME.has(words[upTo - 1])) return results;

  for (let length = MOST_WORDS_IN_A_NAME; length >= 1; length -= 1) {
    const from = upTo - length;
    if (from < 0) continue;

    const taken = words.slice(from, upTo);
    const kept = taken.filter(
      (word) => !FILLER.has(word) || FILLER_THAT_IS_ALSO_A_BOOK.has(word),
    );
    const candidate = kept.join(" ");
    if (!candidate) continue;

    // A one or two letter candidate matches everything and means nothing.
    // "she is 2 cool" became Isaiah 2 this way.
    if (candidate.replace(/\s/g, "").length < 4) continue;

    // The whole window, filler and all. Some recorded mishearings swallow
    // a filler word: Anthony heard Malachi as "an Anakai", and stripping
    // the "an" stops that ever matching what was written down.
    const raw = taken.join(" ");

    // An ordinal right in front is part of the name, not part of it.
    let ordinal = null;
    if (from > 0) {
      const before = words[from - 1];
      Object.entries(ORDINALS).forEach(([value, spellings]) => {
        if (spellings.includes(before)) ordinal = Number.parseInt(value, 10);
      });
    }

    BOOKS.forEach((book) => {
      // A numbered book needs its number, and a plain one must not have
      // somebody else's. Anthony: "if it not say first, it just says John,
      // it means we are talking about the account of Jesus Christ, John."
      if (book.number && book.number !== ordinal) return;
      if (!book.number && ordinal !== null) return;

      const score = Math.max(
        scoreAgainst(candidate, book),
        scoreAgainst(raw, book),
      );
      if (score > 0) {
        results.push({ book, score, candidate, startsAt: ordinal ? from - 1 : from });
      }
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

// ---------------------------------------------------------------------------
// 6. Putting it together
// ---------------------------------------------------------------------------

export function hearReference(text) {
  const words = tidy(text).split(" ").filter(Boolean);
  if (words.length < 2) return null;

  for (let at = 1; at < words.length; at += 1) {
    const chapter = numberAt(words, at);
    if (!chapter) continue;

    // "third John verse 4" has one number in it and it is the verse, not
    // the chapter. Those books have only one chapter, so there is nothing
    // else it could be.
    const saidVerse = ["verse", "verses"].includes(words[at - 1]);

    const found = findBook(words, at);
    if (!found.length) continue;

    const best = found[0];
    // The runner up has to be a different book, not the same book matched
    // on a different number of words.
    const runnerUp = found.find((one) => one.book.name !== best.book.name);

    if (best.score < GOOD_ENOUGH) continue;
    if (runnerUp && best.score - runnerUp.score < CLEAR_OF_SECOND) continue;

    if (saidVerse) {
      if (best.book.chapters !== 1) continue;
      return {
        book: best.book.name,
        chapter: 1,
        verse: chapter.value,
        confidence: Number(best.score.toFixed(3)),
        heardAs: best.candidate,
      };
    }

    if (chapter.value < 1 || chapter.value > best.book.chapters) continue;

    // A verse, if one follows. "chapter 3 verse 5", or just "3 5". Chrome's
    // "3:5" has already become "3 5" by this point, in tidy().
    // "verse number three" is three words before the number arrives.
    let verse = null;
    let after = at + chapter.used;
    while (
      after < words.length &&
      ["verse", "verses", "number", "numbers"].includes(words[after])
    ) {
      after += 1;
    }
    const maybe = numberAt(words, after);
    if (maybe) verse = maybe.value;

    return {
      book: best.book.name,
      chapter: chapter.value,
      verse,
      confidence: Number(best.score.toFixed(3)),
      heardAs: best.candidate,
    };
  }

  return null;
}
