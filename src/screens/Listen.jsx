// src/screens/Listen.jsx
//
// THE LISTENING TEST. Not part of what the church sees.
//
// What it is for
// --------------
// One question decides whether Shomea can exist: can a speech model running
// on a phone hear "Ephesians chapter two verse eight" when a Nigerian
// preacher says it, in a hall, through a lapel mic?
//
// No benchmark answers that. A real service does. So this screen is taken
// to church, switched on, and left running. Everything it hears is written
// down, and the whole log comes off the phone as a text file.
//
// What it must never do
// ---------------------
// It must never keep audio. Only the words that came back. Nothing is
// uploaded. The only network traffic in the whole app is fetching the model
// the first time.
//
// Sections
// --------
//   1. Choosing the model
//   2. What happens to each piece of audio
//   3. Loading, and how far along it is
//   4. The controls
//   5. What it heard
//   6. Getting the log off the phone

import { useCallback, useEffect, useRef, useState } from "react";
import { MODELS, DEFAULT_MODEL, modelName } from "../listening/models.js";
import { useMicrophone } from "../listening/useMicrophone.js";
import { useTranscriber } from "../listening/useTranscriber.js";
import {
  readLog,
  writeLog,
  clearLog,
  asText,
  downloadText,
  copyText,
} from "../shared/sessionLog.js";

export default function Listen() {
  // -------------------------------------------------------------------------
  // 1. Choosing the model
  // -------------------------------------------------------------------------

  const [modelId, setModelId] = useState(DEFAULT_MODEL);
  const [lines, setLines] = useState(() => readLog());
  const [copied, setCopied] = useState(false);

  const modelIdRef = useRef(modelId);
  useEffect(() => {
    modelIdRef.current = modelId;
  }, [modelId]);

  // The graphics chip is not an option today, and the reason is a file size
  // rather than a preference. The ONNX runtime build that WebGPU needs is
  // 27 MB, and Cloudflare Pages refuses anything over 25 MiB, so it cannot
  // be served from our own deployment. Putting it on R2 is a real piece of
  // work and it waits until the accuracy question is answered.
  //
  // scripts/copy-ort.mjs holds the full list of sizes.
  const device = "wasm";
  const dtype = "q8";

  // -------------------------------------------------------------------------
  // 2. What happens to each piece of audio
  // -------------------------------------------------------------------------

  const addLine = useCallback((line) => {
    setLines((previous) => {
      const next = [...previous, line];
      writeLog(next);
      return next;
    });
  }, []);

  const onResult = useCallback(
    ({ text, milliseconds, sent }) => {
      addLine({
        at: Date.now(),
        text,
        milliseconds,
        rms: sent ? sent.rms : 0,
        silent: false,
        model: modelIdRef.current,
      });
    },
    [addLine],
  );

  const onFailure = useCallback(
    (problem) => {
      addLine({
        at: Date.now(),
        error: problem.message,
        milliseconds: problem.milliseconds || 0,
        rms: 0,
        silent: false,
        model: modelIdRef.current,
      });
    },
    [addLine],
  );

  const transcriber = useTranscriber({ onResult, onFailure });

  const onPiece = useCallback(
    ({ audio, rms, silent, seconds }) => {
      if (silent) {
        addLine({ at: Date.now(), silent: true, rms, model: modelIdRef.current });
        return;
      }
      transcriber.offer({ audio, modelId: modelIdRef.current, rms, seconds });
    },
    [addLine, transcriber],
  );

  const microphone = useMicrophone({ onPiece });

  // -------------------------------------------------------------------------
  // 3. Loading, and how far along it is
  // -------------------------------------------------------------------------

  const startEverything = async () => {
    transcriber.load({ modelId, device, dtype });
    await microphone.start();
  };

  const stopEverything = () => {
    microphone.stop();
  };

  // Changing the model while listening would mix two models in one log and
  // make the result meaningless. So it stops first.
  const changeModel = (id) => {
    if (microphone.listening) microphone.stop();
    setModelId(id);
  };

  // -------------------------------------------------------------------------
  // 6. Getting the log off the phone
  // -------------------------------------------------------------------------

  const about = {
    modelId,
    device,
    dtype,
    rate: microphone.rate || microphone.wantedRate,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "not said",
  };

  const saveFile = () => {
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    downloadText(asText(lines, about), `shomea-log-${stamp}.txt`);
  };

  const copyEverything = async () => {
    const worked = await copyText(asText(lines, about));
    setCopied(worked);
    setTimeout(() => setCopied(false), 2500);
  };

  const startAgain = () => {
    if (microphone.listening) microphone.stop();
    clearLog();
    setLines([]);
  };

  const heard = lines.filter((line) => !line.silent && !line.error);
  const failed = lines.filter((line) => line.error);
  const averageMs =
    heard.length > 0
      ? Math.round(
          heard.reduce((total, line) => total + (line.milliseconds || 0), 0) /
            heard.length,
        )
      : 0;

  // Keep the newest line in view without yanking the page while reading.
  const tailRef = useRef(null);
  useEffect(() => {
    if (tailRef.current && microphone.listening) {
      tailRef.current.scrollTop = tailRef.current.scrollHeight;
    }
  }, [lines, microphone.listening]);

  return (
    <main className="page">
      <header className="masthead">
        <p className="eyebrow">Shomea</p>
        <h1>The listening test</h1>
        <p className="standfirst">
          Take this to a service and leave it running. Everything it hears is
          written down and comes off the phone as a file. No audio is kept and
          nothing is uploaded.
        </p>
      </header>

      {/* --- 1. Choosing the model ------------------------------------- */}

      <section className="panel">
        <h2>Which model</h2>
        <p className="panel-intro">
          The first time you pick one it downloads. After that it is kept on
          the phone and works with no internet.
        </p>

        <div className="choices">
          {MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              className={`choice ${model.id === modelId ? "choice-on" : ""}`}
              onClick={() => changeModel(model.id)}
            >
              <span className="choice-name">{model.name}</span>
              <span className="choice-note">{model.note}</span>
              <span className="choice-size">{model.roughSize}</span>
            </button>
          ))}
        </div>

        <p className="panel-foot">
          It runs on the plain route, not the graphics chip. That is a file
          size limit on the host and not a choice, and it will be fixed once
          the accuracy question is answered.
        </p>
      </section>

      {/* --- 3 and 4. Loading and the controls -------------------------- */}

      <section className="panel">
        <h2>Listening</h2>

        <div className="meter" aria-hidden="true">
          <div className="meter-track">
            <div
              className="meter-fill"
              style={{ width: `${microphone.level * 100}%` }}
            />
          </div>
        </div>

        <p className="status">
          {transcriber.status === "loading"
            ? transcriber.progress
              ? `Getting ready. ${transcriber.progress.percent}%`
              : "Getting ready."
            : transcriber.status === "failed"
              ? "It could not get ready. See the lines below."
              : !microphone.listening
                ? "Not listening"
                : transcriber.busy
                  ? "Working on what it just heard"
                  : microphone.level > 0.04
                    ? "Hearing you"
                    : "Listening, nothing said"}
        </p>

        <button
          type="button"
          className={microphone.listening ? "button button-stop" : "button"}
          onClick={microphone.listening ? stopEverything : startEverything}
        >
          {microphone.listening ? "Stop" : "Start listening"}
        </button>

        {microphone.error ? <p className="problem">{microphone.error}</p> : null}

        {microphone.rate && microphone.rate !== microphone.wantedRate ? (
          <p className="problem">
            This device gave {microphone.rate} samples a second instead of{" "}
            {microphone.wantedRate}. The words below will be wrong. Tell
            whoever is building this.
          </p>
        ) : null}
      </section>

      {/* --- 5. What it heard ------------------------------------------- */}

      <section className="panel">
        <h2>What it heard</h2>

        <div className="tallies">
          <div className="tally">
            <span className="tally-number">{heard.length}</span>
            <span className="tally-word">pieces</span>
          </div>
          <div className="tally">
            <span className="tally-number">{averageMs}ms</span>
            <span className="tally-word">each, on average</span>
          </div>
          <div className="tally">
            <span className="tally-number">{failed.length}</span>
            <span className="tally-word">failed</span>
          </div>
        </div>

        <div className="transcript" ref={tailRef}>
          {lines.length === 0 ? (
            <p className="transcript-empty">Nothing yet.</p>
          ) : (
            lines
              .filter((line) => !line.silent)
              .slice(-200)
              .map((line, index) => (
                <p
                  key={`${line.at}-${index}`}
                  className={line.error ? "said said-bad" : "said"}
                >
                  <span className="said-when">
                    {new Date(line.at).toLocaleTimeString("en-GB")}
                  </span>
                  <span className="said-what">
                    {line.error
                      ? `Failed: ${line.error}`
                      : line.text || "(heard nothing)"}
                  </span>
                  {!line.error ? (
                    <span className="said-ms">{line.milliseconds}ms</span>
                  ) : null}
                </p>
              ))
          )}
        </div>

        <div className="button-row">
          <button type="button" className="button" onClick={saveFile}>
            Save the log as a file
          </button>
          <button type="button" className="button button-quiet" onClick={copyEverything}>
            {copied ? "Copied" : "Copy it all"}
          </button>
        </div>

        <button type="button" className="button button-quiet" onClick={startAgain}>
          Clear and start again
        </button>

        <p className="panel-foot">
          The file holds every line, the model that produced it, how long each
          took, and everything run together at the end. Send that file and
          nothing has to be read off a screenshot. Model in use:{" "}
          {modelName(modelId)}.
        </p>
      </section>
    </main>
  );
}
