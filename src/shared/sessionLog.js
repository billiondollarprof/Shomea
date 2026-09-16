// src/shared/sessionLog.js
//
// THE LOG OF EVERYTHING THE APP HEARD, and how to get it out.
//
// Why this file exists
// --------------------
// Anthony records a real service on a phone, and then somebody who is not
// in the room has to read what happened. Without this, the only way to
// share a result is a photograph of a screen.
//
// So every piece of audio the model was given produces one line, and the
// whole lot comes out as a plain text file he can send.
//
// What it must never hold
// -----------------------
// No audio. Ever. Only the words that came back, the timing, and which
// model produced them. Nothing here leaves the device unless he chooses to
// share the file himself. See DIRECTION.md section 5, "Not a recording".
//
// Sections
// --------
//   1. Keeping the log
//   2. Turning it into a file
//   3. Getting it off the phone

const STORE_KEY = "shomea.sessionLog.v1";

// A hard ceiling, so a long service cannot fill the phone.
const MOST_LINES = 4000;

// ---------------------------------------------------------------------------
// 1. Keeping the log
// ---------------------------------------------------------------------------

export function readLog() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeLog(lines) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(lines.slice(-MOST_LINES)));
  } catch {
    // A full or blocked store must never stop the app listening.
    // Bookkeeping never fails the real work.
  }
}

export function clearLog() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    // Same reason as above.
  }
}

// ---------------------------------------------------------------------------
// 2. Turning it into a file
// ---------------------------------------------------------------------------

function twoDigits(value) {
  return String(value).padStart(2, "0");
}

function clockTime(stamp) {
  const when = new Date(stamp);
  return `${twoDigits(when.getHours())}:${twoDigits(when.getMinutes())}:${twoDigits(when.getSeconds())}`;
}

export function asText(lines, about) {
  const head = [
    "SHOMEA LISTENING LOG",
    "",
    `Recorded: ${new Date().toString()}`,
    `Model: ${about.modelId}`,
    `Running on: ${about.device}, shrunk to ${about.dtype}`,
    `Microphone rate: ${about.rate} samples a second`,
    `Device: ${about.userAgent}`,
    `Pieces of audio heard: ${lines.length}`,
    "",
    "Each line is one piece of audio.",
    "  time | how long the model took | how loud it was | what it heard",
    "",
    "----------------------------------------------------------------",
    "",
  ];

  const body = lines.map((line) => {
    if (line.silent) {
      return `${clockTime(line.at)} |      - |  quiet | (nothing said)`;
    }
    if (line.error) {
      return `${clockTime(line.at)} | ${String(line.milliseconds || 0).padStart(5)}ms |  ${line.rms.toFixed(3)} | FAILED: ${line.error}`;
    }
    return `${clockTime(line.at)} | ${String(line.milliseconds || 0).padStart(5)}ms |  ${line.rms.toFixed(3)} | ${line.text || "(heard nothing)"}`;
  });

  const spoken = lines
    .filter((line) => !line.silent && !line.error && line.text)
    .map((line) => line.text)
    .join(" ");

  const tail = [
    "",
    "----------------------------------------------------------------",
    "",
    "EVERYTHING IT HEARD, RUN TOGETHER",
    "",
    spoken || "(nothing)",
    "",
  ];

  return [...head, ...body, ...tail].join("\n");
}

// ---------------------------------------------------------------------------
// 3. Getting it off the phone
// ---------------------------------------------------------------------------

export function downloadText(text, filename) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
