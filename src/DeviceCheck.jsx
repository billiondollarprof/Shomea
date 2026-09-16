// src/DeviceCheck.jsx
//
// THE DEVICE CHECK. The first screen Shomea ever had.
//
// What it is for
// --------------
// Anthony has a phone and an iPad and no laptop, so he cannot run anything
// locally. This page is how he finds out what his own devices can actually
// do, by opening one URL.
//
// It answers four of the open questions in RESEARCH.md section 7 directly,
// from the real hardware, rather than from somebody's blog post:
//
//   1. Is there a graphics chip this app can use, or is it the slow route?
//   2. Does the microphone open, and is it hearing anything?
//   3. How much can this device keep, and will it be allowed to keep it?
//   4. Can the screen be held awake through a sermon?
//
// What it must never do
// ---------------------
// It must never record anything. The microphone is opened to measure a
// level and it is closed the moment the check stops. Nothing is stored and
// nothing is sent anywhere. See DIRECTION.md section 5, "Not a recording".
//
// A note on the words on screen
// -----------------------------
// DIRECTION.md section 4 says plain words on every screen, and this page
// bends that rule on purpose, because its only reader is Anthony and the
// point is for him to learn the terms. So each one is said plainly first
// and named in brackets after. That is the house rule from CLAUDE.md, not
// an exception to it. The screens the church sees follow section 4 exactly.
//
// Sections in this file
// ---------------------
//   1. Reading what the device supports
//   2. Listening to the microphone, and measuring the level
//   3. The level meter
//   4. One result row
//   5. The page

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// 1. Reading what the device supports
// ---------------------------------------------------------------------------
//
// Every check is wrapped, because a browser that does not have a feature
// sometimes throws when asked about it rather than answering "no". A check
// that crashes the page tells nobody anything.

function readSupport() {
  const checks = [];

  // The graphics chip. This is the difference between the speech model
  // running comfortably and running slowly.
  let hasGpu = false;
  try {
    hasGpu = typeof navigator !== "undefined" && "gpu" in navigator;
  } catch {
    hasGpu = false;
  }
  checks.push({
    id: "gpu",
    label: "Uses the graphics chip",
    detail: "WebGPU, the fast route for the listening model",
    state: hasGpu ? "good" : "workable",
    note: hasGpu
      ? "Available. This is the fast route."
      : "Not available. It will still work, on the slower route, and that needs measuring before anything is decided.",
  });

  // Can it be installed and kept on the device.
  let hasWorker = false;
  try {
    hasWorker = "serviceWorker" in navigator;
  } catch {
    hasWorker = false;
  }
  checks.push({
    id: "worker",
    label: "Can work with no internet",
    detail: "Service worker, the part that keeps the app on the device",
    state: hasWorker ? "good" : "bad",
    note: hasWorker
      ? "Supported."
      : "Not supported. Offline is a rule, not a feature, so this device cannot run Shomea.",
  });

  // Holding the screen awake for the length of a sermon.
  let hasWakeLock = false;
  try {
    hasWakeLock = "wakeLock" in navigator;
  } catch {
    hasWakeLock = false;
  }
  checks.push({
    id: "wake",
    label: "Keeps the screen awake",
    detail: "Wake Lock, so it does not sleep during the sermon",
    state: hasWakeLock ? "good" : "workable",
    note: hasWakeLock
      ? "Supported."
      : "Not supported. The screen may sleep, and the setting would have to be changed on the device by hand.",
  });

  // Whether there is a microphone route at all.
  let hasMic = false;
  try {
    hasMic = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  } catch {
    hasMic = false;
  }
  checks.push({
    id: "mic",
    label: "Can open a microphone",
    detail: "Needed for every part of this app",
    state: hasMic ? "good" : "bad",
    note: hasMic
      ? "Available. Tap Start listening, in the first panel above, to prove it."
      : "Not available. This page has to be opened over https for the microphone to be offered at all.",
  });

  return checks;
}

// How much room the app is allowed. This is the question that decides
// whether the model survives from one Sunday to the next on an iPhone.
// RESEARCH.md section 7, item 2.
async function readStorage() {
  try {
    if (!navigator.storage || !navigator.storage.estimate) return null;
    const { quota, usage } = await navigator.storage.estimate();
    let persisted = null;
    try {
      if (navigator.storage.persisted) persisted = await navigator.storage.persisted();
    } catch {
      persisted = null;
    }
    return { quota, usage, persisted };
  } catch {
    return null;
  }
}

function asMegabytes(bytes) {
  if (typeof bytes !== "number") return "not said";
  return `${Math.round(bytes / 1024 / 1024).toLocaleString("en-GB")} MB`;
}

// ---------------------------------------------------------------------------
// 2. Listening to the microphone, and measuring the level
// ---------------------------------------------------------------------------
//
// This opens the microphone, reads how loud it is many times a second, and
// closes everything again when it stops.
//
// autoGainControl is deliberately switched OFF here. RESEARCH.md section 2
// explains why: it turns the volume up when things go quiet, which with a
// lapel mic means it turns up the room between sentences. This page is how
// that gets tested with a real microphone in a real room, so it must not
// quietly be on.

function useMicrophoneLevel() {
  const [listening, setListening] = useState(false);
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(0);
  const [error, setError] = useState(null);

  const streamRef = useRef(null);
  const contextRef = useRef(null);
  const frameRef = useRef(null);

  const stop = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (contextRef.current) {
      contextRef.current.close().catch(() => {});
      contextRef.current = null;
    }
    setListening(false);
    setLevel(0);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setPeak(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const context = new (window.AudioContext || window.webkitAudioContext)();
      contextRef.current = context;

      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);

      const buffer = new Float32Array(analyser.fftSize);

      const read = () => {
        analyser.getFloatTimeDomainData(buffer);

        // Root mean square: the honest average loudness of this slice of
        // audio, rather than whichever single sample happened to be biggest.
        let sum = 0;
        for (let i = 0; i < buffer.length; i += 1) sum += buffer[i] * buffer[i];
        const rms = Math.sqrt(sum / buffer.length);

        const shown = Math.min(1, rms * 4);
        setLevel(shown);
        setPeak((previous) => (shown > previous ? shown : previous));

        frameRef.current = requestAnimationFrame(read);
      };

      read();
      setListening(true);
    } catch (problem) {
      setError(
        problem && problem.name === "NotAllowedError"
          ? "Permission was refused. Allow the microphone and try again."
          : "The microphone could not be opened on this device.",
      );
      stop();
    }
  }, [stop]);

  // Close the microphone if this page goes away while it is open.
  useEffect(() => stop, [stop]);

  return { listening, level, peak, error, start, stop };
}

// ---------------------------------------------------------------------------
// 3. The level meter
// ---------------------------------------------------------------------------

function LevelMeter({ level, peak, listening }) {
  return (
    <div className="meter" aria-hidden="true">
      <div className="meter-track">
        <div className="meter-fill" style={{ width: `${level * 100}%` }} />
        <div className="meter-peak" style={{ left: `${peak * 100}%` }} />
      </div>
      <p className="meter-words">
        {!listening
          ? "Not listening"
          : level > 0.04
            ? "Hearing you"
            : "Not hearing anything"}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. One result row
// ---------------------------------------------------------------------------

function Row({ check }) {
  return (
    <li className={`row row-${check.state}`}>
      <div className="row-head">
        <span className="row-dot" aria-hidden="true" />
        <span className="row-label">{check.label}</span>
      </div>
      <p className="row-detail">{check.detail}</p>
      <p className="row-note">{check.note}</p>
    </li>
  );
}

// ---------------------------------------------------------------------------
// 5. The page
// ---------------------------------------------------------------------------

export default function DeviceCheck() {
  const [checks, setChecks] = useState([]);
  const [storage, setStorage] = useState(null);
  const [storageRead, setStorageRead] = useState(false);
  const mic = useMicrophoneLevel();

  useEffect(() => {
    setChecks(readSupport());
    readStorage().then((result) => {
      setStorage(result);
      setStorageRead(true);
    });
  }, []);

  return (
    <main className="page">
      <header className="masthead">
        <p className="eyebrow">Shomea</p>
        <h1>What can this device do?</h1>
        <p className="standfirst">
          Open this on every device the church might use. It answers, from the
          real hardware, what the research could only guess at.
        </p>
      </header>

      <section className="panel">
        <h2>The microphone</h2>
        <p className="panel-intro">
          This opens the microphone, shows how loud it is, and closes it again
          when you stop. Nothing is recorded, stored or sent anywhere.
        </p>

        <LevelMeter
          level={mic.level}
          peak={mic.peak}
          listening={mic.listening}
        />

        <button
          type="button"
          className={mic.listening ? "button button-stop" : "button"}
          onClick={mic.listening ? mic.stop : mic.start}
        >
          {mic.listening ? "Stop listening" : "Start listening"}
        </button>

        {mic.error ? <p className="problem">{mic.error}</p> : null}

        <p className="panel-foot">
          Plug in the lapel microphone and speak from where the preacher
          stands. The bar should move clearly. If it barely moves, the
          microphone is the problem, and no amount of software fixes that.
        </p>
      </section>

      <section className="panel">
        <h2>What it can keep</h2>
        {!storageRead ? (
          <p className="panel-intro">Reading.</p>
        ) : storage ? (
          <>
            <p className="big-number">{asMegabytes(storage.quota)}</p>
            <p className="panel-intro">
              This is the most this device will let the app keep. Using{" "}
              {asMegabytes(storage.usage)} of it now.
            </p>
            <p className="panel-foot">
              Kept for certain:{" "}
              {storage.persisted === null
                ? "this device will not say"
                : storage.persisted
                  ? "yes"
                  : "no, so it may be cleared if the app goes unused"}
              . That last line is the one that matters. A church app runs once
              a week, and if this device clears it in between, everything has
              to be downloaded again every Sunday.
            </p>
          </>
        ) : (
          <p className="panel-intro">This device will not say.</p>
        )}
      </section>

      <section className="panel">
        <h2>Everything else</h2>
        <ul className="rows">
          {checks.map((check) => (
            <Row key={check.id} check={check} />
          ))}
        </ul>
      </section>

      <footer className="footer">
        <p>
          Nothing on this page is the app. It is the measuring tape. The app
          comes next.
        </p>
      </footer>
    </main>
  );
}
