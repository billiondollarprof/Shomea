// src/screens/Dev.jsx
//
// THE PAGE NOBODY ELSE FINDS. It lives at /dev.
//
// Why it is hidden behind a path rather than a menu item
// -----------------------------------------------------
// Anthony's brief, and it is right. The media team open Shomea and see one
// thing: the verse. They should never meet a listening test, a model
// chooser, or a line about WebAssembly. Those things do not make them more
// capable, they make them nervous.
//
// So everything technical lives here, at an address only he knows, and the
// front door has no link to it.
//
// It is NOT a security boundary. Anybody who types /dev gets in. It is a
// door in the right place, not a lock, and nothing behind it is private or
// dangerous. Do not put anything here that would matter if it were found.
//
// Sections
// --------
//   1. The two tools
//   2. The page

import { useState } from "react";
import Listen from "./Listen.jsx";
import Device from "./Device.jsx";

// ---------------------------------------------------------------------------
// 1. The two tools
// ---------------------------------------------------------------------------

const TOOLS = [
  { id: "listen", name: "Listening test" },
  { id: "device", name: "This device" },
];

// ---------------------------------------------------------------------------
// 2. The page
// ---------------------------------------------------------------------------

export default function Dev() {
  const [tool, setTool] = useState("listen");

  return (
    <div>
      <div className="page" style={{ paddingBottom: 0 }}>
        <div className="tabs" role="tablist">
          {TOOLS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={tool === entry.id}
              className={tool === entry.id ? "tab tab-on" : "tab"}
              onClick={() => setTool(entry.id)}
            >
              {entry.name}
            </button>
          ))}
        </div>
      </div>

      {tool === "listen" ? <Listen /> : <Device />}
    </div>
  );
}
