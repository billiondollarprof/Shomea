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

import { hearReference, hearReferences } from "../src/scripture/hear.js";

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
  // Real, from Chrome on Anthony's iPad (Apple's engine), 2026-10-31. It
  // writes "3, 3" as the one number "33".
  ["Maleko 33", "Malachi", 3, 3],
  ["Malachi 44", "Malachi", 4, 4],
  ["turn to Ephesians 28", "Ephesians", 2, 8],
  // Real, from Anthony's phone, 2026-11-03. Chrome and Moonshine.
  ["Def Jam 1:2", "James", 1, 2],
  ["dude Chapter 1 Verse 3", "Jude", 1, 3],
  ["Dead John 1 verse 2.", "3 John", 1, 2],
  ["Malachi 4 best one", "Malachi", 4, 1],
  ["John 33", "John", 3, 3],
  ["1st Timothy 2:1", "1 Timothy", 2, 1],
  ["songs of Solomon 2:1", "Song of Solomon", 2, 1],
  // Real, from Anthony's phone, 2026-11-04.
  // A stray number between the chapter and "verse" must not become the verse.
  ["Psalm 23, 3, verse 1.", "Psalms", 23, 1],
  ["Malakai chapter 3 verse 10", "Malachi", 3, 10],
  ["Normals chapter 8 verse 28.", "Romans", 8, 28],
  ["Several Peter chapter three verse nine", "2 Peter", 3, 9],
  // The numbered books.
  ["first John chapter 4 verse 8", "1 John", 4, 8],
  ["second Timothy chapter 3 verse 16", "2 Timothy", 3, 16],
  ["John chapter 3 verse 16", "John", 3, 16],
  // 3 John has one chapter, so a bare "verse 4" is 3 John 1:4.
  ["third John verse 4", "3 John", 1, 4],
  // Spoken numbers past ten.
  ["Psalm twenty three", "Psalms", 23, null],
];

// --- Should find SEVERAL, in the order said --------------------------------
// A phrase can hold more than one when two come with less than a pause
// between them. All of them are found and the last stays on the screen.
const SHOULD_FIND_ALL = [
  // Real, from Anthony's phone, 2026-11-04.
  [
    "Normals chapter 8 verse 28. Philippians chapter 4 verse 13.",
    [["Romans", 8, 28], ["Philippians", 4, 13]],
  ],
  [
    "First Corinthians chapter 13 verse 4. First Thessalonians chapter 5 verse 16. He gave reign through children and took us. Second Timothy 2 verse 14.",
    [["1 Corinthians", 13, 4], ["1 Thessalonians", 5, 16], ["2 Timothy", 2, 14]],
  ],
  [
    "1 Chronicles 4:10 1 Corinthians 13:4 1 Thessalonians 5:16 We give we three children and two cars.",
    [["1 Chronicles", 4, 10], ["1 Corinthians", 13, 4], ["1 Thessalonians", 5, 16]],
  ],
  [
    "Romans chapter 8 verse 28. Philippians chapter 4 verse 13. James chapter 1 verse 2.",
    [["Romans", 8, 28], ["Philippians", 4, 13], ["James", 1, 2]],
  ],
  // The 3 after "verse" belongs to James. It is not the "third" in front of
  // John, and John has 21 chapters, so a bare "John verse 3" is nothing.
  [
    "James chapter 1 verse 2. Over there are verse 3. John verse 3.",
    [["James", 1, 2]],
  ],
  // But a real ordinal in the next sentence still counts.
  [
    "James chapter 1 verse 2. First John chapter 4 verse 8.",
    [["James", 1, 2], ["1 John", 4, 8]],
  ],
  [
    "2 Corinthians 3, verse 16. 1 Peter 5, verse 7. 2 Peter 3, verse 9.",
    [["2 Corinthians", 3, 16], ["1 Peter", 5, 7], ["2 Peter", 3, 9]],
  ],
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
  // Two ways to split 112, so a guess would be a wrong verse. Nothing.
  "Genesis 112",
  // Too big for any chapter and no single way to split it.
  "Malachi 99",
  // From the same iPad log. Words Apple heard badly: no number to find.
  "Ecclesiastes several that eats",
  "Philip yours now this one",
  // The number must not be taken into the book's name. There is no chapter 2
  // of Obadiah, and "obadiah 2" used to be read as Obadiah 1.
  "obadiah 2:1",
  // Nahum has 3 chapters.
  "nahum 4",
  // "jam" sounds like James and "dead" sounds like "third". Neither is a
  // reference when it is only a word in a sentence.
  "we sat in a traffic jam 4 hours",
  "the dead John 3 times",
  // A model repeating itself. Real, from Moonshine on Anthony's phone,
  // 2026-11-04. It opened Psalms 50:10.
  "Psalm 50:10-14:14-14:17-14:25:25:17:14:24:24:24:24:24:24:",
  // "several" is only an ordinal in front of a numbered book.
  "several people came and sat in chapter 3",
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

console.log("\nSHOULD FIND SEVERAL\n");
for (const [text, wanted] of SHOULD_FIND_ALL) {
  const got = hearReferences(text).map((r) => [r.book, r.chapter, r.verse]);
  if (JSON.stringify(got) === JSON.stringify(wanted)) {
    passed += 1;
    console.log(`  ok    ${wanted.map((w) => w.join(" ")).join("  then  ")}`);
  } else {
    failed += 1;
    console.log(`  MISS  wanted ${JSON.stringify(wanted)}`);
    console.log(`        got    ${JSON.stringify(got)}`);
    console.log(`        from "${text}"`);
  }
}

console.log("\nSHOULD FIND NOTHING\n");
for (const text of SHOULD_IGNORE) {
  // The WHOLE line is checked, not just the first reference in it.
  const everything = hearReferences(text);
  const got = everything.length ? everything[0] : null;
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
