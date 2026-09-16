// src/shared/displayTheme.js
//
// THE COLOURS OF THE VERSE SCREEN.
//
// Anthony's brief: the media team should be able to change the colour of
// the display to any of the nice dark colours, and the text changes with it
// so it always reads.
//
// So the team picks a background and nothing else. The text colour is
// worked out from it, never chosen. That is the whole point: a person
// cannot pick dark grey on black by accident and discover it from the back
// of the hall during a service.
//
// Why only dark backgrounds
// -------------------------
// The screen is a projector in a room with the lights down. A light
// background is a lamp pointed at the congregation. A custom colour is
// allowed, but it is darkened first if it is too bright to project.
//
// Sections
// --------
//   1. The chosen palette
//   2. Reading a colour
//   3. Working out the text colour

// ---------------------------------------------------------------------------
// 1. The chosen palette
// ---------------------------------------------------------------------------

export const PALETTE = [
  { id: "ink", name: "Ink", background: "#05060D" },
  { id: "midnight", name: "Midnight", background: "#0A1628" },
  { id: "forest", name: "Forest", background: "#07211A" },
  { id: "wine", name: "Wine", background: "#210A14" },
  { id: "royal", name: "Royal", background: "#150A2E" },
  { id: "slate", name: "Slate", background: "#14181F" },
  { id: "umber", name: "Umber", background: "#1C1208" },
  { id: "teal", name: "Deep teal", background: "#04212B" },
];

export const DEFAULT_BACKGROUND = PALETTE[0].background;

// ---------------------------------------------------------------------------
// 2. Reading a colour
// ---------------------------------------------------------------------------

function toParts(hex) {
  const clean = String(hex).replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((character) => character + character)
          .join("")
      : clean;
  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value) || full.length !== 6) return { r: 5, g: 6, b: 13 };
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function toHex({ r, g, b }) {
  const pair = (n) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${pair(r)}${pair(g)}${pair(b)}`;
}

// How bright a colour looks to an eye, not how big its numbers are. Green
// looks much brighter than blue at the same value, and this accounts for it.
function brightness({ r, g, b }) {
  const channel = (value) => {
    const part = value / 255;
    return part <= 0.03928 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

// ---------------------------------------------------------------------------
// 3. Working out the text colour
// ---------------------------------------------------------------------------
//
// The text takes a faint tint of the background so the screen reads as one
// colour rather than white pasted on top. It is never allowed to get dark
// enough to be hard to read, and a background that is too bright to project
// is darkened rather than refused.

export function screenColours(background) {
  let parts = toParts(background);

  // Too bright for a dark room. Pull it down rather than arguing about it.
  while (brightness(parts) > 0.28) {
    parts = { r: parts.r * 0.75, g: parts.g * 0.75, b: parts.b * 0.75 };
  }

  const safeBackground = toHex(parts);

  // A very light version of the same colour, for the verse itself.
  const text = toHex({
    r: parts.r + (255 - parts.r) * 0.94,
    g: parts.g + (255 - parts.g) * 0.94,
    b: parts.b + (255 - parts.b) * 0.94,
  });

  // A quieter version, for the reference line above the verse.
  const quiet = toHex({
    r: parts.r + (255 - parts.r) * 0.62,
    g: parts.g + (255 - parts.g) * 0.62,
    b: parts.b + (255 - parts.b) * 0.62,
  });

  return { background: safeBackground, text, quiet };
}
