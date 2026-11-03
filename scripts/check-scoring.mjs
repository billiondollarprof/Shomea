// scripts/check-scoring.mjs
//
// IS THE READING LIST FAIR, AND DOES THE SCORER COUNT HONESTLY?
//
// Two jobs.
//
// 1. Every line on the list, heard PERFECTLY, must give the verse it claims
//    and every preaching line must give nothing. If one fails, the list is
//    wrong and not the app, and it would make the app look worse than it is.
//
// 2. The scorer must count correctly on logs we build by hand, including the
//    case that matters most: a verse that opens when it should not.
//
//     node scripts/check-scoring.mjs

import { READING_LIST } from "../src/shared/readingList.js";
import { scoreLog } from "../src/shared/scoreLog.js";
import { hearReference } from "../src/scripture/hear.js";

let passed = 0;
let failed = 0;

function check(name, got, wanted) {
  const ok = JSON.stringify(got) === JSON.stringify(wanted);
  if (ok) {
    passed += 1;
    console.log(`  ok    ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`          wanted ${JSON.stringify(wanted)}`);
    console.log(`          got    ${JSON.stringify(got)}`);
  }
}

console.log("\nThe list itself, heard perfectly");
READING_LIST.forEach((item) => {
  const found = hearReference(item.say);
  const got = found ? { book: found.book, chapter: found.chapter, verse: found.verse || 1 } : null;
  check(`"${item.say}"`, got, item.expect);
});

// A log is built from lines in the real format.
function logOf(texts) {
  return texts
    .map((text, i) => `14:${String(10 + i).padStart(2, "0")}:00 |   n/a |  0.000 | ${text}`)
    .join("\n");
}
const said = READING_LIST.map((item) => item.say);

console.log("\nThe scorer, on logs built by hand");
let score = scoreLog(logOf(said), READING_LIST);
check("a perfect log is 100%", [score.percent, score.missed.length, score.shownWrongly.length], [100, 0, 0]);

score = scoreLog(logOf(said.filter((s) => !s.startsWith("Third John"))), READING_LIST);
check("one verse never heard is one missed", [score.missed, score.shownWrongly.length], [["3 John 1:2"], 0]);

score = scoreLog(logOf([...said.slice(0, 5), "Malachi 4:4", ...said.slice(5)]), READING_LIST);
check("a verse nobody asked for is shown wrongly", [score.right === score.asked, score.shownWrongly.map((x) => x.opened)], [true, ["Malachi 4:4"]]);

score = scoreLog(logOf(said.map((s) => (s.startsWith("We have been") ? "Psalm 20 verse one" : s))), READING_LIST);
check("preaching that opens a verse is shown wrongly", score.shownWrongly.map((x) => x.opened), ["Psalms 20:1"]);

score = scoreLog(logOf([said[0], said[0], said[1]]), READING_LIST);
check("an overlapping piece that repeats itself counts once", score.shownWrongly.length, 0);

score = scoreLog("14:28:43 |      - |      - | NOTE: Hearing with Chrome.\n14:28:44 |      - |  quiet | (nothing said)\n14:28:45 |  900ms |  0.02 | (heard nothing)", READING_LIST);
check("notes and empty lines are not lines", score.lines, 0);

score = scoreLog("14:29:22 |   n/a |  0.000 | Genesis 1:1   [screen: opened Genesis 1:1]", READING_LIST);
check("the screen note on the end is ignored", [score.lines, score.right], [1, 1]);

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
