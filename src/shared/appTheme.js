// src/shared/appTheme.js
//
// LIGHT OR DARK, for the screens a person works on.
//
// This is not the screen colour the church sees. That is a different thing
// and it lives in displayTheme.js. A hall with the lights down is dark
// whatever the person setting it up prefers, so the display never follows
// this setting.
//
// The choice is written onto the html element as data-theme, which is what
// styles.css reads. It is also remembered, and it starts from whatever the
// phone itself is set to, so the first open already looks right.
//
// Sections
// --------
//   1. Reading and writing the choice
//   2. The hook

import { useCallback, useEffect, useState } from "react";

const KEY = "shomea.theme";

// ---------------------------------------------------------------------------
// 1. Reading and writing the choice
// ---------------------------------------------------------------------------

function whatThePhonePrefers() {
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}

function firstChoice() {
  try {
    const kept = localStorage.getItem(KEY);
    if (kept === "light" || kept === "dark") return kept;
  } catch {
    // Falling through to the phone's own setting is the right answer here.
  }
  return whatThePhonePrefers();
}

// ---------------------------------------------------------------------------
// 2. The hook
// ---------------------------------------------------------------------------

export function useAppTheme() {
  const [theme, setTheme] = useState(firstChoice);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      // Remembering is a convenience. Never let it break the app.
    }
  }, [theme]);

  const choose = useCallback((next) => setTheme(next), []);

  return { theme, choose };
}
