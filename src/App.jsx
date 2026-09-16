// src/App.jsx
//
// THE SHELL. It decides which screen is showing and holds the menu.
//
// The addresses
// -------------
//   /       the verse display. This is what the church sees, and it is all
//           they ever see.
//   /dev    the listening test and the device check. Anthony only.
//
// There is no link from one to the other, on purpose. See Dev.jsx.
//
// Why there is no navigation bar
// ------------------------------
// The app has one screen that matters, and a projector must never show a
// menu across the top of a verse. So there is a single button in the
// corner, it fades back on the display, and during a service nobody goes
// near it.
//
// Why routing is written by hand
// ------------------------------
// There are two addresses. A routing library is thousands of lines to
// choose between two strings. If this ever grows to five or six, bring one
// in. Not before.
//
// Sections
// --------
//   1. Which address are we at
//   2. Remembering the screen colour
//   3. The menu
//   4. The shell

import { useCallback, useEffect, useState } from "react";
import Display from "./screens/Display.jsx";
import Dev from "./screens/Dev.jsx";
import { PALETTE, DEFAULT_BACKGROUND } from "./shared/displayTheme.js";
import { useAppTheme } from "./shared/appTheme.js";

// ---------------------------------------------------------------------------
// 1. Which address are we at
// ---------------------------------------------------------------------------

function readPath() {
  try {
    return window.location.pathname.replace(/\/+$/, "").toLowerCase();
  } catch {
    return "";
  }
}

function useAddress() {
  const [path, setPath] = useState(readPath);

  useEffect(() => {
    const onBack = () => setPath(readPath());
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, []);

  const goTo = useCallback((next) => {
    window.history.pushState({}, "", next);
    setPath(readPath());
  }, []);

  return { path, goTo };
}

// ---------------------------------------------------------------------------
// 2. Remembering the screen colour
// ---------------------------------------------------------------------------

const BACKGROUND_KEY = "shomea.background";

function remembered(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const { path, goTo } = useAddress();
  const { theme, choose } = useAppTheme();
  const [background, setBackground] = useState(() =>
    remembered(BACKGROUND_KEY, DEFAULT_BACKGROUND),
  );
  const [menuOpen, setMenuOpen] = useState(false);

  const onDev = path === "/dev";

  useEffect(() => {
    try {
      localStorage.setItem(BACKGROUND_KEY, background);
    } catch {
      // A convenience. Never let it break the app.
    }
  }, [background]);

  // Escape closes the menu. Somebody who opened it by mistake mid-service
  // should not have to hunt for the right place to tap.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className={onDev ? "shell" : "shell shell-display"}>
      {/* ------------------------------------------------------------------
          3. The menu
          ------------------------------------------------------------------ */}

      <button
        type="button"
        className={menuOpen ? "hamburger hamburger-open" : "hamburger"}
        aria-label={menuOpen ? "Close the menu" : "Open the menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className={menuOpen ? "bars bars-x" : "bars"} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </button>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="menu-behind"
            aria-label="Close the menu"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="menu">
            <p className="menu-title">Shomea</p>

            {/* The screen colour only means anything on the display, so it
                is only offered there. A control that does nothing where it
                is shown is a control that teaches people not to trust the
                app. */}
            {!onDev ? (
              <div>
                <p className="menu-subtitle">Screen colour</p>
                <p className="menu-help">
                  The words change with it, so they always read.
                </p>

                <div className="swatches">
                  {PALETTE.map((colour) => (
                    <button
                      key={colour.id}
                      type="button"
                      className={
                        colour.background.toLowerCase() === background.toLowerCase()
                          ? "swatch swatch-on"
                          : "swatch"
                      }
                      style={{ background: colour.background }}
                      aria-label={colour.name}
                      title={colour.name}
                      onClick={() => setBackground(colour.background)}
                    />
                  ))}
                </div>

                <label className="custom-colour">
                  <input
                    type="color"
                    value={background}
                    onChange={(event) => setBackground(event.target.value)}
                  />
                  <span>Or pick your own</span>
                </label>
              </div>
            ) : null}

            <div className={onDev ? "" : "menu-block"}>
              <p className="menu-subtitle">This app</p>
              <p className="menu-help">
                Light or dark, for the screens you work on. The verse screen
                keeps its own colour either way.
              </p>

              <div className="theme-switch">
                <button
                  type="button"
                  className={
                    theme === "light" ? "theme-option theme-option-on" : "theme-option"
                  }
                  onClick={() => choose("light")}
                >
                  Light
                </button>
                <button
                  type="button"
                  className={
                    theme === "dark" ? "theme-option theme-option-on" : "theme-option"
                  }
                  onClick={() => choose("dark")}
                >
                  Dark
                </button>
              </div>
            </div>

            {onDev ? (
              <div className="menu-block">
                <button
                  type="button"
                  className="button button-quiet"
                  onClick={() => {
                    goTo("/");
                    setMenuOpen(false);
                  }}
                >
                  Back to the verse screen
                </button>
              </div>
            ) : null}
          </nav>
        </>
      ) : null}

      {/* ------------------------------------------------------------------
          4. The shell
          ------------------------------------------------------------------ */}

      {onDev ? <Dev /> : <Display background={background} />}
    </div>
  );
}
