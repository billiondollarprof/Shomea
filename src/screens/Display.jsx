// src/screens/Display.jsx
//
// THE SCREEN THE CHURCH SEES. This is the product. Everything else in the
// app exists to put the right words here.
//
// What is real and what is not, today
// -----------------------------------
// The layout, the fitting and the colour choosing are real and finished.
// The verse is a stand in, because the Bible text is not in the app yet.
// The moment it is, this screen does not change: it is already being handed
// a reference and a body of text and it does not care where they came from.
//
// IT IS A SLIDE, NOT A PAGE
// -------------------------
// It is built for a projector, which is wide and short. Think of a
// PowerPoint slide: a quiet line of reference at the top, a rule under it,
// the verse filling the middle, nothing else. On a phone held upright it
// still works, but landscape is what it is for and what it is tuned to.
//
// The rules this screen obeys
// ---------------------------
// It holds one verse. Not a list, not a history, not a sidebar. A person at
// the back of a hall reads one thing.
//
// Nothing on it can be tapped during a service. The colour controls live
// behind the menu, where a hand cannot land on them by accident.
//
// **IT NEVER SCROLLS.** Nobody scrolls a projector. If the verse does not
// fit, the verse gets smaller, and it keeps getting smaller until it fits.
// That is what section 1 below does, and it is the whole reason this file
// is not just a paragraph in a box.
//
// The first version of this screen sized the text by counting characters
// and capped the width at "26ch". On a phone it looked fine. On a projector
// the column came out about 220 pixels wide and the verse ran straight off
// the bottom of the screen, because "ch" was being measured against the
// small body text rather than against the verse. Do not go back to that.
// Measure the real box.
//
// Sections
// --------
//   1. Making the verse fit, whatever its length and whatever the screen
//   2. The screen

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { screenColours } from "../shared/displayTheme.js";

// A stand in, so the screen can be judged before the Bible text exists.
const EXAMPLE = {
  reference: "Ephesians 2:8",
  version: "King James Version",
  body:
    "For by grace are ye saved through faith; and that not of yourselves: " +
    "it is the gift of God.",
};

// ---------------------------------------------------------------------------
// 1. Making the verse fit, whatever its length and whatever the screen
// ---------------------------------------------------------------------------
//
// The text is set as large as it can be while still fitting inside its box,
// found by halving the range rather than by guessing from the length. It is
// about a dozen measurements and finishes in well under one frame, so it is
// never seen happening.
//
// SMALLEST is deliberately not tiny. If a verse will not fit at 18px on the
// screen in front of it, something is wrong upstream and shrinking further
// only produces something nobody can read anyway.

const SMALLEST = 18;
const LARGEST = 260;

function useFittedText(text, ready) {
  const boxRef = useRef(null);
  const textRef = useRef(null);
  const [size, setSize] = useState(48);

  const fit = useCallback(() => {
    const box = boxRef.current;
    const element = textRef.current;
    if (!box || !element) return;

    const roomHigh = box.clientHeight;
    const roomWide = box.clientWidth;
    if (roomHigh <= 0 || roomWide <= 0) return;

    let low = SMALLEST;
    let high = LARGEST;
    let best = SMALLEST;

    for (let step = 0; step < 12; step += 1) {
      const middle = (low + high) / 2;
      element.style.fontSize = `${middle}px`;

      const fits =
        element.scrollHeight <= roomHigh + 1 && element.scrollWidth <= roomWide + 1;

      if (fits) {
        best = middle;
        low = middle;
      } else {
        high = middle;
      }
    }

    element.style.fontSize = `${best}px`;
    setSize(best);
  }, []);

  // Fit before the browser paints, so nothing is seen jumping.
  useLayoutEffect(() => {
    fit();
  }, [fit, text, ready]);

  // A projector can be plugged in after the page is open, and a phone can
  // be turned on its side. Both change the box.
  useEffect(() => {
    const box = boxRef.current;
    if (!box || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", fit);
      return () => window.removeEventListener("resize", fit);
    }
    const watcher = new ResizeObserver(fit);
    watcher.observe(box);
    return () => watcher.disconnect();
  }, [fit]);

  return { boxRef, textRef, size };
}

// ---------------------------------------------------------------------------
// 2. The screen
// ---------------------------------------------------------------------------

export default function Display({ background, verse }) {
  const shown = verse || EXAMPLE;
  const [colours, setColours] = useState(() => screenColours(background));

  useEffect(() => {
    setColours(screenColours(background));
  }, [background]);

  const { boxRef, textRef } = useFittedText(shown.body, colours.background);

  return (
    <div
      className="display"
      style={{ background: colours.background, color: colours.text }}
    >
      <p className="display-reference" style={{ color: colours.quiet }}>
        {shown.reference}
        <span className="display-version">{shown.version}</span>
        <span className="display-rule" aria-hidden="true" />
      </p>

      <div className="display-box" ref={boxRef}>
        <p className="display-body" ref={textRef}>
          {shown.body}
        </p>
      </div>

      <p className="display-foot" style={{ color: colours.quiet }}>
        {verse ? "" : "Example verse. The Bible text is not in the app yet."}
      </p>
    </div>
  );
}
