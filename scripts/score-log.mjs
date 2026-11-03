// scripts/score-log.mjs
//
// SCORES A LISTENING LOG AGAINST THE READING LIST.
//
//     node scripts/score-log.mjs path/to/log.txt
//
// The list is src/shared/readingList.js and the method is explained in
// src/shared/scoreLog.js. Nothing here is clever: it reads the file, scores
// it and prints the result in plain words.

import { readFileSync } from "node:fs";
import { READING_LIST } from "../src/shared/readingList.js";
import { scoreLog } from "../src/shared/scoreLog.js";

const path = process.argv[2];
if (!path) {
  console.error("Give it the log file: node scripts/score-log.mjs path/to/log.txt");
  process.exit(2);
}

const result = scoreLog(readFileSync(path, "utf8"), READING_LIST);

console.log(`\nLines in the log:        ${result.lines}`);
console.log(`Verses on the list:      ${result.asked}`);
console.log(`Shown correctly:         ${result.right}  (${result.percent}%)`);
console.log(`Missed:                  ${result.missed.length}`);
console.log(`SHOWN WRONGLY:           ${result.shownWrongly.length}`);

if (result.missed.length) {
  console.log("\nMissed:");
  result.missed.forEach((one) => console.log(`  ${one}`));
}
if (result.shownWrongly.length) {
  console.log("\nShown wrongly, with the words that caused it:");
  result.shownWrongly.forEach((one) =>
    console.log(`  ${one.opened}   from   "${one.from}"`),
  );
}
console.log("");
