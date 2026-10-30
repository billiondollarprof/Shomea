// src/listening/engine.js
//
// WHO IS LISTENING RIGHT NOW: CHROME'S OWN EARS, OR MOONSHINE.
//
// Anthony, 2026-10-30, after Chrome heard "Malachi", "Ecclesiastes", "Proverbs"
// and "Titus" correctly on his phone:
//
//   "anytime it's offline, the system switches to moonshine when the
//   network is not strong... we can still optimize it and use it when the
//   system is offline as a backup."
//
// So there are two engines and one rule: Chrome while it works, Moonshine
// when it does not. This file is only the rule. It holds no state, touches
// no browser, and is tested in scripts/check-engine.mjs without opening one.
//
// WHY IT NEVER LOOKS AT THE BROWSER'S NAME
// ----------------------------------------
// Firefox has no speech recognition. Brave HAS the call, passes every "is it
// there" check, and then fails every time with "network", because Brave does
// not pay Google for it. Safari has a partial one. A list of names is always
// wrong about somebody. Trying it, and moving on the moment it fails, is
// right about all of them, and it is also what covers a weak signal. That is
// the same case from the app's side.
//
// What it must never do
// ---------------------
// It must never treat a refused microphone as an engine problem. Both
// engines need the microphone, so switching would only fail a second time.
//
// Sections
// --------
//   1. Can Chrome be used right now
//   2. What to do when it fails

// How long to leave Chrome alone after it fails while the internet is on.
// That is the Brave case, or a signal too weak to use. It tries again after
// each wait, and each wait is longer, so a browser that can never do it
// costs one quick failure every few minutes and nothing more.
export const WAITS_BEFORE_TRYING_AGAIN = [
  2 * 60 * 1000,
  5 * 60 * 1000,
  15 * 60 * 1000,
];

// ---------------------------------------------------------------------------
// 1. Can Chrome be used right now
// ---------------------------------------------------------------------------

export function chromeIsUsable({ exists, online, blockedUntil, now }) {
  return Boolean(exists) && Boolean(online) && now >= blockedUntil;
}

// ---------------------------------------------------------------------------
// 2. What to do when it fails
// ---------------------------------------------------------------------------
//
// `kind` is the error name Chrome gives. `failuresSoFar` counts the times it
// has already failed with the internet on, which sets how long to wait.
//
// The answer is one of:
//   stop        nothing can be fixed by switching. Tell the person.
//   switch      go to Moonshine. `blockMs` says how long to leave Chrome alone
//               (0 means "until the internet comes back").
//   carry on    not worth acting on. Write it down and keep going.

export function afterFailure({ kind, online, failuresSoFar }) {
  if (kind === "not-allowed" || kind === "audio-capture") {
    return { action: "stop" };
  }

  if (kind === "network" && !online) {
    return { action: "switch", why: "There is no internet.", blockMs: 0 };
  }

  if (
    kind === "network" ||
    kind === "service-not-allowed" ||
    kind === "language-not-supported"
  ) {
    const step = Math.min(failuresSoFar, WAITS_BEFORE_TRYING_AGAIN.length - 1);
    return {
      action: "switch",
      why: "Chrome would not hear on this device, even with the internet on.",
      blockMs: WAITS_BEFORE_TRYING_AGAIN[step],
    };
  }

  return { action: "carry on" };
}
