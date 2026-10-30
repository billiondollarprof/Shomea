// scripts/check-memory.mjs
//
// DOES THE SCREEN DO THE RIGHT THING WHEN THE PASTOR SPEAKS?
//
// Each test is a short service: a list of sentences said one after another,
// and what the screen should be showing after each. The order matters,
// because most of what he says only means something against what is already
// up. "The next verse" is meaningless on its own.
//
// The sentences come from COMMANDS.md, which is Anthony's own record of his
// pastor, and from the real Chrome and Moonshine logs. The second group
// matters as much as the first: sentences that LOOK like instructions and
// are only preaching. DIRECTION.md says never show the wrong verse.
//
//     node scripts/check-memory.mjs

import { understand, startingScreen } from "../src/scripture/memory.js";

// [what was said, what the screen should read afterwards]
// The screen reads as "Book chapter:verse VERSION".
const SERVICES = [
  {
    name: "a reference, then moving around it",
    steps: [
      ["Malachi 3:3", "Malachi 3:3 KJV"],
      ["can we see the next verse", "Malachi 3:4 KJV"],
      ["the next verse", "Malachi 3:5 KJV"],
      ["let's go to the previous verse", "Malachi 3:4 KJV"],
      ["before that, verse 2", "Malachi 3:2 KJV"],
      ["can we see the next chapter", "Malachi 4:1 KJV"],
    ],
  },
  {
    name: "the version changes and the verse does not",
    steps: [
      ["Ephesians chapter two verse eight", "Ephesians 2:8 KJV"],
      ["NLT", "Ephesians 2:8 NLT"],
      ["let's see the amplified version", "Ephesians 2:8 AMP"],
      ["the living Bible", "Ephesians 2:8 TLB"],
      ["new king james", "Ephesians 2:8 NKJV"],
      ["the next verse", "Ephesians 2:9 NKJV"],
    ],
  },
  {
    name: "a verse and a version in one breath, version first",
    steps: [["what NLT calls it in proverbs 5:10", "Proverbs 5:10 NLT"]],
  },
  {
    name: "Chrome's colon and Moonshine's words arrive the same",
    steps: [
      ["Titus 1:2", "Titus 1:2 KJV"],
      ["Hebrews chapter one, verse two", "Hebrews 1:2 KJV"],
      ["Proverbs 22", "Proverbs 22:1 KJV"],
    ],
  },
  {
    name: "at the edges it leaves the screen alone",
    steps: [
      ["Malachi 4:1", "Malachi 4:1 KJV"],
      ["can we see the next chapter", "Malachi 4:1 KJV"],
      ["Obadiah 1:1", "Obadiah 1:1 KJV"],
      ["the previous verse", "Obadiah 1:1 KJV"],
    ],
  },
  {
    name: "that verse again, after the screen has moved on",
    steps: [
      ["Romans 8:28", "Romans 8:28 KJV"],
      ["Romans 8:31", "Romans 8:31 KJV"],
      ["let's read that verse again, media", "Romans 8:28 KJV"],
    ],
  },
  {
    name: "it does nothing before anything is showing",
    steps: [
      ["the next verse", " KJV"],
      ["can we see the next chapter", " KJV"],
    ],
  },
  {
    name: "the pastor preaching, which must change nothing",
    steps: [
      ["John 3:16", "John 3:16 KJV"],
      ["in the next verse he tells us that God loved the world so much", "John 3:16 KJV"],
      ["and I want to say that again", "John 3:16 KJV"],
      ["she has a passion for the next generation", "John 3:16 KJV"],
      ["that is good news for everybody in this room today", "John 3:16 KJV"],
      ["Hallelujah! Glory to God!", "John 3:16 KJV"],
      ["verse nine of that psalm is one I love", "John 3:16 KJV"],
      ["we start at 10:30 tomorrow", "John 3:16 KJV"],
    ],
  },
];

function reads(screen) {
  const place = screen.book ? `${screen.book} ${screen.chapter}:${screen.verse}` : "";
  return `${place} ${screen.version}`;
}

let passed = 0;
let failed = 0;

for (const service of SERVICES) {
  console.log(`\n${service.name}`);
  let screen = startingScreen();
  for (const [said, expected] of service.steps) {
    const result = understand(said, screen);
    screen = result.screen;
    const got = reads(screen);
    if (got === expected) {
      passed += 1;
      console.log(`  ok    "${said}"  ->  ${got}`);
    } else {
      failed += 1;
      console.log(`  FAIL  "${said}"`);
      console.log(`          wanted ${expected}`);
      console.log(`          got    ${got}   (${result.did})`);
    }
  }
}

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
