// scripts/check-segmenter.mjs
//
// DOES THE MICROPHONE CUT AT THE PAUSES AND NEVER IN THE MIDDLE OF A WORD?
//
// The audio here is MADE UP: steady noise for a room, and bursts shaped like
// speech, with a dip about every quarter of a second like the gaps between
// words. It proves the cutting rules. It does NOT prove the settings suit
// Anthony's voice and microphone. Only his phone can, and the first real
// test on it is what the settings in segmenter.js get tuned from.
//
//     node scripts/check-segmenter.mjs

import { makeSegmenter } from "../src/listening/segmenter.js";

const RATE = 16000;

// A small repeatable random number, so the "room" is the same every run.
let seed = 12345;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296 - 0.5;
}

const seconds = (n) => Math.round(n * RATE);

function room(secs, sigma = 0.004) {
  const out = new Float32Array(seconds(secs));
  for (let i = 0; i < out.length; i += 1) out[i] = random() * 2 * sigma * 1.7;
  return out;
}

// Speech-like: a voice, rising and falling about 3.5 times a second so it
// dips almost to nothing between "syllables".
function speech(secs, amp = 0.06) {
  const out = new Float32Array(seconds(secs));
  for (let i = 0; i < out.length; i += 1) {
    const t = i / RATE;
    const envelope = 0.55 + 0.45 * Math.sin(2 * Math.PI * 3.5 * t - Math.PI / 2 + 1.2);
    const voice =
      Math.sin(2 * Math.PI * 130 * t) +
      0.6 * Math.sin(2 * Math.PI * 260 * t) +
      0.3 * Math.sin(2 * Math.PI * 520 * t);
    out[i] = amp * envelope * voice + random() * 0.006;
  }
  return out;
}

function hum(secs, amp) {
  const out = new Float32Array(seconds(secs));
  for (let i = 0; i < out.length; i += 1) out[i] = amp * Math.sin((2 * Math.PI * 120 * i) / RATE) + random() * 0.002;
  return out;
}

function click(secs, amp) {
  const out = new Float32Array(seconds(secs));
  for (let i = 0; i < out.length; i += 1) out[i] = amp * Math.sin((2 * Math.PI * 900 * i) / RATE);
  return out;
}

function join(...parts) {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const all = new Float32Array(total);
  let at = 0;
  parts.forEach((p) => {
    all.set(p, at);
    at += p.length;
  });
  return all;
}

// Feeds the sound in the same size chunks the browser uses, 4096 at a time.
function run(sound) {
  const segmenter = makeSegmenter({ rate: RATE });
  const found = [];
  for (let at = 0; at < sound.length; at += 4096) {
    found.push(...segmenter.push(sound.slice(at, at + 4096)));
  }
  found.push(...segmenter.flush());
  return found;
}

const end = (seg) => seg.startedAt + seg.seconds;

let passed = 0;
let failed = 0;
function check(name, ok, detail) {
  if (ok) {
    passed += 1;
    console.log(`  ok    ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? `   (${detail})` : ""}`);
  }
}
const show = (segs) => segs.map((s) => `${s.startedAt.toFixed(2)}-${end(s).toFixed(2)}`).join(", ") || "none";

console.log("\nOne phrase in a quiet room");
let segs = run(join(room(3), speech(2), room(3)));
check("one phrase gives one piece", segs.length === 1, show(segs));
check("it starts before the speech does, so the first word is whole", segs[0] && segs[0].startedAt <= 2.85, show(segs));
check("it holds the speech to the very end", segs[0] && end(segs[0]) >= 5.0, show(segs));
check("it does not drag the long silence along", segs[0] && segs[0].seconds < 3.2, `${segs[0] && segs[0].seconds.toFixed(2)}s`);

console.log("\nTwo phrases");
segs = run(join(room(1), speech(1.5), room(1.5), speech(1.5), room(2)));
check("a 1.5 second pause splits them in two", segs.length === 2, show(segs));
segs = run(join(room(1), speech(1.5), room(0.4), speech(1.5), room(2)));
check("a 0.4 second pause stays one phrase", segs.length === 1, show(segs));

console.log("\nThe old clock cut");
segs = run(join(room(4.9), speech(2.1), room(3)));
check("speech across the old 5 second mark is NOT split", segs.length === 1, show(segs));
check("and it is whole, start to end", segs[0] && segs[0].startedAt <= 4.65 && end(segs[0]) >= 7.0, show(segs));

console.log("\nQuiet speech, like Anthony's phone");
segs = run(join(room(2), speech(2, 0.04), room(2)));
check("speech at about 0.02 loudness is still heard", segs.length === 1, show(segs));

console.log("\nSpeech that goes on and on");
segs = run(join(room(2), speech(30), room(3)));
check("it is cut into pieces of at most 12 seconds", segs.length >= 3 && segs.every((s) => s.seconds <= 12.1), show(segs));
let joined = true;
for (let i = 1; i < segs.length; i += 1) joined = joined && segs[i].startedAt <= end(segs[i - 1]);
check("each piece starts before the last one ends, so no word falls in a gap", joined, show(segs));
check("the whole 30 seconds is covered", segs[0] && segs[0].startedAt <= 1.85 && end(segs[segs.length - 1]) >= 31.9, show(segs));

console.log("\nNoises that are not speech");
segs = run(join(room(3), click(0.05, 0.5), room(3)));
check("a click is thrown away", segs.length === 0, show(segs));
segs = run(room(10));
check("a quiet room gives nothing", segs.length === 0, show(segs));
segs = run(join(hum(16, 0.03), room(2)));
check("a loud steady hum is never sent on, not once", segs.length === 0, show(segs));
segs = run(join(hum(16, 0.03), room(1), speech(2, 0.25), room(3)));
check("speech well above the hum is still found afterwards", segs.length === 1, show(segs));

console.log("\nListening stops mid-phrase");
const segmenter = makeSegmenter({ rate: RATE });
const early = [...segmenter.push(join(room(2), speech(1.5)))];
check("nothing comes out while the phrase is still going", early.length === 0);
check("stopping gives the phrase back instead of losing it", segmenter.flush().length === 1);

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
