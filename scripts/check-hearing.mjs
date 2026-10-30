// scripts/check-hearing.mjs
//
// DOES THE MATCHER FIND THE VERSE IN WHAT THE MODEL ACTUALLY HEARD?
//
// Every line below was really produced by a speech model on Anthony's
// phone, or is a phrase he wrote down from his own pastor. Nothing here is
// invented, because a test written from imagination only proves the
// imagination.
//
// The second half matters as much as the first: lines that must produce
// NOTHING. DIRECTION.md says never show the wrong verse, so a matcher that
// finds a verse in "That's number one" has failed, however many it gets
// right elsewhere.
//
//     node scripts/check-hearing.mjs

import { hearReference } from "../src/scripture/hear.js";

// --- Should find a reference ----------------------------------------------
const SHOULD_FIND = [
  // Real, from Anthony's phone, 2026-09-16 and 2026-10-29.
  ["I want you to turn to the book of Exodus chapter 6 verse 1.", "Exodus", 6, 1],
  ["Exodus two, verse number three.", "Exodus", 2, 3],
  ["Hebrews chapter one, verse two.", "Hebrews", 1, 2],
  ["And you shall be glad. Somebody opened the book of Proverbs 13, 18.", "Proverbs", 13, 18],
  // Real mishearings that must still land.
  ["Like toast one one", "Titus", 1, 1],
  ["Provide chapter 2 verse 1", "Proverbs", 2, 1],
  ["Diters chapter 1 verse 1", "Titus", 1, 1],
  // Anthony's own example, 2026-10-30.
  ["in an Anakai chapter 3, verse 5", "Malachi", 3, 5],
  ["turn to a fee shins chapter 2 verse 8", "Ephesians", 2, 8],
  // Real, from Chrome's own ears on Anthony's phone, 2026-10-30. Chrome
  // writes the colon a Bible prints, which Moonshine never does.
  ["Malachi 3:3", "Malachi", 3, 3],
  ["ecclesiastes 4:19", "Ecclesiastes", 4, 19],
  ["Proverbs 22", "Proverbs", 22, null],
  ["Titus 1:2", "Titus", 1, 2],
  // The same colon with a numbered book and with words around it.
  ["1 John 4:8", "1 John", 4, 8],
  ["turn with me to Ephesians 2:8", "Ephesians", 2, 8],
  // The numbered books.
  ["first John chapter 4 verse 8", "1 John", 4, 8],
  ["second Timothy chapter 3 verse 16", "2 Timothy", 3, 16],
  ["John chapter 3 verse 16", "John", 3, 16],
  // 3 John has one chapter, so a bare "verse 4" is 3 John 1:4.
  ["third John verse 4", "3 John", 1, 4],
  // Spoken numbers past ten.
  ["Psalm twenty three", "Psalms", 23, null],
];

// --- Should find NOTHING --------------------------------------------------
const SHOULD_IGNORE = [
  // Real, from Anthony's phone. Numbers with no book in front of them.
  "That's number one",
  "Best number line",
  "8.",
  "Ah good girl.",
  "Diters sharp.",
  "He bestowed so.",
  "Hallelujah! Glory to God!",
  // Real, from Chrome, 2026-10-30. Words only, so it must stay silent.
  "and the angels spoke saying",
  // "psalm is" sounds like "Psalms", and "one" follows it. Preaching.
  "verse nine of that psalm is one I love",
  // A time of day has a colon and is not a verse.
  "we start at 10:30 tomorrow",
  "(heard nothing)",
  // The classic false positive the eager parsers all fall for.
  "she is 2 cool",
  "I have three children and two cars",
  "we are going to look at that in a minute",
];

let passed = 0;
let failed = 0;

console.log("SHOULD FIND A REFERENCE\n");
for (const [text, book, chapter, verse] of SHOULD_FIND) {
  const got = hearReference(text);
  const right =
    got && got.book === book && got.chapter === chapter && got.verse === verse;
  if (right) {
    passed += 1;
    console.log(`  ok    ${got.book} ${got.chapter}${got.verse ? ":" + got.verse : ""}`
      + `  (${got.confidence}, heard "${got.heardAs}")`);
  } else {
    failed += 1;
    const wanted = `${book} ${chapter}${verse ? ":" + verse : ""}`;
    const actually = got
      ? `${got.book} ${got.chapter}${got.verse ? ":" + got.verse : ""} (${got.confidence})`
      : "nothing";
    console.log(`  MISS  wanted ${wanted}, got ${actually}`);
    console.log(`        from "${text}"`);
  }
}

console.log("\nSHOULD FIND NOTHING\n");
for (const text of SHOULD_IGNORE) {
  const got = hearReference(text);
  if (!got) {
    passed += 1;
    console.log(`  ok    "${text}"`);
  } else {
    failed += 1;
    console.log(`  WRONG "${text}"`);
    console.log(`        showed ${got.book} ${got.chapter} (${got.confidence}, heard "${got.heardAs}")`);
  }
}

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
