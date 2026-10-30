// scripts/check-engine.mjs
//
// DOES THE APP PICK THE RIGHT EARS?
//
// The rule is in src/listening/engine.js. Every case here is one of the ways
// it could go wrong in a church: no signal, a browser that pretends to have
// speech recognition, a refused microphone. Run with:
//
//     node scripts/check-engine.mjs

import {
  chromeIsUsable,
  afterFailure,
  WAITS_BEFORE_TRYING_AGAIN,
} from "../src/listening/engine.js";

let passed = 0;
let failed = 0;

function check(name, got, wanted) {
  const same = JSON.stringify(got) === JSON.stringify(wanted);
  if (same) {
    passed += 1;
    console.log(`  ok    ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`          wanted ${JSON.stringify(wanted)}`);
    console.log(`          got    ${JSON.stringify(got)}`);
  }
}

console.log("\nCan Chrome be used right now");
const now = 1_000_000;
check("everything fine", chromeIsUsable({ exists: true, online: true, blockedUntil: 0, now }), true);
check("Firefox, no speech at all", chromeIsUsable({ exists: false, online: true, blockedUntil: 0, now }), false);
check("no internet", chromeIsUsable({ exists: true, online: false, blockedUntil: 0, now }), false);
check("still being left alone after a failure", chromeIsUsable({ exists: true, online: true, blockedUntil: now + 1, now }), false);
check("the wait is over", chromeIsUsable({ exists: true, online: true, blockedUntil: now, now }), true);

console.log("\nWhat to do when it fails");
check("no internet: go to Moonshine, no wait", afterFailure({ kind: "network", online: false, failuresSoFar: 0 }),
  { action: "switch", why: "There is no internet.", blockMs: 0 });
check("Brave: the internet is on and it still fails",
  afterFailure({ kind: "network", online: true, failuresSoFar: 0 }).blockMs, WAITS_BEFORE_TRYING_AGAIN[0]);
check("the second failure waits longer",
  afterFailure({ kind: "network", online: true, failuresSoFar: 1 }).blockMs, WAITS_BEFORE_TRYING_AGAIN[1]);
check("the wait stops growing at the last one",
  afterFailure({ kind: "network", online: true, failuresSoFar: 50 }).blockMs,
  WAITS_BEFORE_TRYING_AGAIN[WAITS_BEFORE_TRYING_AGAIN.length - 1]);
check("a service Chrome will not run", afterFailure({ kind: "service-not-allowed", online: true, failuresSoFar: 0 }).action, "switch");
check("a language it does not have", afterFailure({ kind: "language-not-supported", online: true, failuresSoFar: 0 }).action, "switch");
check("a refused microphone is not the engine's fault", afterFailure({ kind: "not-allowed", online: true, failuresSoFar: 0 }), { action: "stop" });
check("no microphone at all", afterFailure({ kind: "audio-capture", online: true, failuresSoFar: 0 }), { action: "stop" });
check("anything unknown is written down and ignored", afterFailure({ kind: "something-new", online: true, failuresSoFar: 0 }), { action: "carry on" });

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
