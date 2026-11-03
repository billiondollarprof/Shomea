// src/shared/scoreLog.js
//
// HOW MANY OF THE VERSES ON THE LIST WERE SHOWN, AND HOW MANY WERE WRONG.
//
// It reads a listening log (the text file the app sends out), runs every line
// through the matcher again, and compares the verses that would have opened
// against the reading list in the order they were read.
//
// Why it re-reads the text instead of trusting the "[screen: ...]" notes
// ----------------------------------------------------------------------
// The notes record what the app did WHEN the log was made. Reading the text
// again scores the matcher as it is NOW. So an old log can be scored again
// after every fix, which is the whole way to know a fix helped.
//
// How the comparison works
// ------------------------
// A speech engine does not give one line per thing said. It can split a
// phrase in two or join two together. So lines are not paired with list items
// one by one. Instead it takes the verses that opened, in order, and the verses
// that were asked for, in order, and finds the longest run they share (the
// longest common subsequence). Anything on the list inside that run was
// RIGHT. Anything on the list outside it was MISSED. Anything that opened and
// is not in the run was SHOWN WRONGLY: a wrong verse, or a verse that
// preaching should never have opened.
//
// SHOWN WRONGLY is the number that matters most. A missed verse costs a
// pause. A wrong verse on the screen costs the room's trust.
//
// What it must never do
// ---------------------
// It never touches the network or the app's state. It is a pure function over
// text, so it can be tested without a browser.

import { hearReference } from "../scripture/hear.js";

// One line of the log looks like:
//   14:29:22 |   n/a |  0.000 | Philippians 2:3   [screen: opened ...]
// Everything before the third bar is bookkeeping.
const LINE = /^\d\d:\d\d:\d\d \|[^|]*\|[^|]*\|\s?(.*)$/;

export function linesOf(log) {
  const found = [];
  String(log || "")
    .split(/\r?\n/)
    .forEach((raw) => {
      const match = LINE.exec(raw);
      if (!match) return;
      // Notes in square brackets at the end of a line are bookkeeping, and
      // there can be two: how long the phrase was, and what the screen did.
      const text = match[1].replace(/(\s+\[[^\]]*\])+\s*$/, "").trim();
      if (!text) return;
      if (/^(NOTE:|FAILED:|\(nothing said\)|\(heard nothing\))/.test(text)) return;
      found.push(text);
    });
  return found;
}

function same(a, b) {
  return a.book === b.book && a.chapter === b.chapter && a.verse === b.verse;
}

function label(r) {
  return `${r.book} ${r.chapter}:${r.verse}`;
}

// What the screen would have been told to open, in order. A chapter on its
// own opens verse 1, which is what memory.js does. The same verse twice in a
// row is one opening, because overlapping pieces repeat themselves.
export function openedBy(lines) {
  const opened = [];
  lines.forEach((text) => {
    const found = hearReference(text);
    if (!found) return;
    const next = { book: found.book, chapter: found.chapter, verse: found.verse || 1, text };
    const last = opened[opened.length - 1];
    if (last && same(last, next)) return;
    opened.push(next);
  });
  return opened;
}

// The longest run the two share, in order. Standard dynamic programming.
function longestShared(asked, opened) {
  const rows = asked.length + 1;
  const cols = opened.length + 1;
  const table = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      table[i][j] = same(asked[i - 1], opened[j - 1])
        ? table[i - 1][j - 1] + 1
        : Math.max(table[i - 1][j], table[i][j - 1]);
    }
  }

  const askedHit = new Set();
  const openedHit = new Set();
  let i = asked.length;
  let j = opened.length;
  while (i > 0 && j > 0) {
    if (same(asked[i - 1], opened[j - 1])) {
      askedHit.add(i - 1);
      openedHit.add(j - 1);
      i -= 1;
      j -= 1;
    } else if (table[i - 1][j] >= table[i][j - 1]) {
      i -= 1;
    } else {
      j -= 1;
    }
  }
  return { askedHit, openedHit };
}

export function scoreLog(log, list) {
  const lines = linesOf(log);
  const opened = openedBy(lines);
  const asked = list.filter((item) => item.expect).map((item) => item.expect);

  const { askedHit, openedHit } = longestShared(asked, opened);

  const right = askedHit.size;
  const missed = asked
    .map((one, index) => ({ one, index }))
    .filter(({ index }) => !askedHit.has(index))
    .map(({ one }) => label(one));
  const shownWrongly = opened
    .map((one, index) => ({ one, index }))
    .filter(({ index }) => !openedHit.has(index))
    .map(({ one }) => ({ opened: label(one), from: one.text }));

  return {
    lines: lines.length,
    asked: asked.length,
    right,
    missed,
    shownWrongly,
    percent: asked.length ? Math.round((right / asked.length) * 100) : 0,
  };
}
