// src/App.jsx
//
// THE SHELL. It decides which screen is showing and holds the menu.
//
// Why there is no navigation bar
// ------------------------------
// Anthony's brief, and he is right: the app has no navigation. It has one
// screen that matters, the verse, and a projector must never show a menu
// bar across the top of it.
//
// So there is a single button in the corner. It opens a panel, the panel
// closes, and the screen underneath is untouched. During a service nobody
// goes near it.
//
// Why the display has no page padding
// -----------------------------------
// Every other screen is a document and sits in a column. The display is not
// a document, it is a wall. It takes the whole window.
//
// Sections
// --------
//   1. The sections there are
//   2. Remembering where you were
//   3. The menu
//   4. The shell

import { useCallback, useEffect, useState } from "react";
import Display from "./screens/Display.jsx";
import Listen from "./screens/Listen.jsx";
import Device from "./screens/Device.jsx";
import { PALETTE, DEFAULT_BACKGROUND } from "./shared/displayTheme.js";

// ---------------------------------------------------------------------------
// 1. The sections there are
// ---------------------------------------------------------------------------

const SECTIONS = [
  {
    id: "display",
    name: "Display",
    note: "What the church sees",
  },
  {
    id: "listen",
    name: "Listening test",
    note: "Take this to a service",
  },
  {
    id: "device",
    name: "This device",
    note: "What it can and cannot do",
  },
];

// ---------------------------------------------------------------------------
// 2. Remembering where you were
// ---------------------------------------------------------------------------

const SECTION_KEY = "shomea.section";
const BACKGROUND_KEY = "shomea.background";

function remembered(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function remember(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Remembering is a convenience. Never let it break the app.
  }
}

export default function App() {
  // Listening is the default for now, because that is the work in hand.
  // When the Bible text lands, change this to "display".
  const [section, setSection] = useState(() => remembered(SECTION_KEY, "listen"));
  const [background, setBackground] = useState(() =>
    remembered(BACKGROUND_KEY, DEFAULT_BACKGROUND),
  );
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => remember(SECTION_KEY, section), [section]);
  useEffect(() => remember(BACKGROUND_KEY, background), [background]);

  // Escape closes the menu. A projector operator who opened it by mistake
  // should be able to get out without hunting for the right place to tap.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const go = useCallback((id) => {
    setSection(id);
    setMenuOpen(false);
  }, []);

  const onDisplay = section === "display";

  return (
    <div className={onDisplay ? "shell shell-bare" : "shell"}>
      {/* ------------------------------------------------------------------
          3. The menu
          ------------------------------------------------------------------ */}

      <button
        type="button"
        className="hamburger"
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

            <ul className="menu-list">
              {SECTIONS.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className={
                      entry.id === section ? "menu-item menu-item-on" : "menu-item"
                    }
                    onClick={() => go(entry.id)}
                  >
                    <span className="menu-item-name">{entry.name}</span>
                    <span className="menu-item-note">{entry.note}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="menu-colours">
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
          </nav>
        </>
      ) : null}

      {/* ------------------------------------------------------------------
          4. The shell
          ------------------------------------------------------------------ */}

      {section === "display" ? <Display background={background} /> : null}
      {section === "listen" ? <Listen /> : null}
      {section === "device" ? <Device /> : null}
    </div>
  );
}
