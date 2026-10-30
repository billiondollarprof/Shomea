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
//
// TWO COMPLETELY DIFFERENT PATHS THROUGH THIS SCREEN
// --------------------------------------------------
// Picking a model gives the normal path: the microphone cuts the sound into
// pieces, a worker runs the model on each piece, and the words come back.
//
// Picking the browser's own ears skips all of that. Chrome takes the sound
// itself and hands back finished words, so there is no microphone of ours,
// no worker and no download. Everything below asks which path is live
// before it decides what to show.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MODELS,
  DEFAULT_MODEL,
  modelName,
  isBrowserEars,
} from "../listening/models.js";
import { useMicrophone } from "../listening/useMicrophone.js";
import { useTranscriber } from "../listening/useTranscriber.js";
import { understand, startingScreen, versionName } from "../scripture/memory.js";
import {
  useBrowserEars,
  askAboutLanguages,
  installLanguage,
  LANGUAGES,
} from "../listening/useBrowserEars.js";
import {
  readLog,
  writeLog,
  clearLog,
  asText,
  downloadText,
  copyText,
  shareLog,
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
  const device = "wasm"; // plain-words-ok: a value, never shown on screen
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

  // What the church screen would be showing. Held in a ref as well as in
  // state, because two phrases can arrive before React has redrawn, and the
  // second one has to be read against the first.
  const [screenNow, setScreenNow] = useState(startingScreen);
  const screenRef = useRef(screenNow);

  const onResult = useCallback(
    ({ text, milliseconds, sent }) => {
      const outcome = understand(text, screenRef.current);
      screenRef.current = outcome.screen;
      setScreenNow(outcome.screen);

      addLine({
        at: Date.now(),
        text,
        milliseconds,
        rms: sent ? sent.rms : 0,
        silent: false,
        model: modelIdRef.current,
        // Written into the log so a service can be read back afterwards
        // and every wrong move can be traced to the sentence that caused it.
        screen: outcome.changed ? outcome.did : null,
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
      // NOTHING IS SENT UNTIL THE MODEL IS READY.
      //
      // This used to send audio the moment the microphone opened, while the
      // model was still downloading. Every piece came back "No model
      // loaded", filling the log with failures that were not failures and
      // making a download that was working look broken. Anthony read that
      // and concluded the model never loaded.
      //
      // A download in progress is not an error, so it is not written down
      // as one.
      if (transcriber.status !== "ready") return;

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
  // 2b. The other path: the browser's own ears
  // -------------------------------------------------------------------------
  //
  // Chrome hands back whole phrases rather than fixed pieces, so each line
  // is written down exactly as onResult would do it. Nothing else is shared
  // between the two paths.

  const usingBrowser = isBrowserEars(modelId);
  const browserEars = useBrowserEars({ onHeard: onResult, onFailure });

  // What Chrome says about each language, filled in when he asks. Three
  // answers are possible: it is already here, it can be fetched, or this
  // Chrome is too old to even be asked.
  const [languageAnswers, setLanguageAnswers] = useState(null);
  const [installing, setInstalling] = useState(null);

  const checkLanguages = async () => {
    setLanguageAnswers(await askAboutLanguages());
  };

  const fetchPack = async (lang) => {
    setInstalling(lang);
    const what = await installLanguage(lang);
    setInstalling(null);
    addLine({
      at: Date.now(),
      text: `Asked for ${lang} on this device: ${what}`,
      milliseconds: 0,
      rms: 0,
      silent: false,
      model: modelIdRef.current,
    });
    await checkLanguages();
  };

  // One switch for "is it on", whichever path is live, so the button and
  // the status line below do not each have to work it out.
  const listening = usingBrowser ? browserEars.listening : microphone.listening;

  // -------------------------------------------------------------------------
  // 3. Loading, and how far along it is
  // -------------------------------------------------------------------------

  const startEverything = async () => {
    if (usingBrowser) {
      browserEars.start();
      return;
    }
    transcriber.load({ modelId, device, dtype });
    await microphone.start();
  };

  const stopEverything = () => {
    if (usingBrowser) {
      browserEars.stop();
      return;
    }
    microphone.stop();
  };

  // Changing the model while listening would mix two models in one log and
  // make the result meaningless. So it stops first, and it stops BOTH paths
  // because the one being left behind is the one still running.
  const changeModel = (id) => {
    if (microphone.listening) microphone.stop();
    if (browserEars.listening) browserEars.stop();
    setModelId(id);
  };

  // -------------------------------------------------------------------------
  // 6. Getting the log off the phone
  // -------------------------------------------------------------------------

  const about = {
    modelId,
    device: usingBrowser ? "the browser itself" : device,
    dtype: usingBrowser ? "none" : dtype,
    language: usingBrowser ? browserEars.lang : "not used",
    onDevice: usingBrowser ? browserEars.onDevice : "not used",
    rate: microphone.rate || microphone.wantedRate,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "not said",
  };

  const stampedName = () =>
    `shomea-log-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.txt`;

  const saveFile = () => {
    downloadText(asText(lines, about), stampedName());
  };

  // The first choice on a phone. It opens WhatsApp, email, anything, so the
  // log reaches somebody who is not in the building. If the phone will not
  // share, it quietly saves the file instead rather than doing nothing.
  const sendIt = async () => {
    const text = asText(lines, about);
    const what = await shareLog(text, stampedName());
    if (what === "cannot") downloadText(text, stampedName());
  };

  const copyEverything = async () => {
    const worked = await copyText(asText(lines, about));
    setCopied(worked);
    setTimeout(() => setCopied(false), 2500);
  };

  const startAgain = () => {
    if (microphone.listening) microphone.stop();
    if (browserEars.listening) browserEars.stop();
    clearLog();
    setLines([]);
    screenRef.current = startingScreen();
    setScreenNow(screenRef.current);
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
    if (tailRef.current && listening) {
      tailRef.current.scrollTop = tailRef.current.scrollHeight;
    }
  }, [lines, listening]);

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
        <h2>Which one listens</h2>
        <p className="panel-intro">
          {usingBrowser
            ? "This one is built into Chrome already. There is nothing to download."
            : "The first time you pick one it downloads. After that it is kept on the phone and works with no internet."}
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
          {usingBrowser
            ? "This one is Chrome's own hearing. Nothing downloads. It works in Chrome. Other browsers may not have it, and some only pretend to."
            : "It runs on the plain route, not the graphics chip. That is a file size limit on the host and not a choice, and it will be fixed once the accuracy question is answered."}
        </p>
      </section>

      {/* --- 1b. Chrome's own hearing, and whether it can work offline -- */}

      {usingBrowser ? (
        <section className="panel">
          <h2>Chrome's own hearing</h2>

          {!browserEars.exists ? (
            <p className="problem">
              This browser does not have it. Open the page in Chrome.
            </p>
          ) : (
            <>
              <p className="panel-intro">
                Chrome can do this two ways. On the device, which works with
                no internet, or over the internet, which is usually better
                but needs a signal. Try both and compare the lines below.
              </p>

              <div className="choices">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    className={`choice ${lang === browserEars.lang ? "choice-on" : ""}`}
                    onClick={() => {
                      if (browserEars.listening) browserEars.stop();
                      browserEars.setLang(lang);
                    }}
                  >
                    <span className="choice-name">
                      {lang === "en-NG"
                        ? "Nigerian English"
                        : lang === "en-GB"
                          ? "British English"
                          : "American English"}
                    </span>
                    <span className="choice-note">{lang}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className={`button ${browserEars.onDevice ? "" : "button-quiet"}`}
                onClick={() => {
                  if (browserEars.listening) browserEars.stop();
                  browserEars.setOnDevice(!browserEars.onDevice);
                }}
              >
                {browserEars.onDevice
                  ? "Using the device. Tap to use the internet instead."
                  : "Using the internet. Tap to use the device instead."}
              </button>

              <div className="button-row" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="button button-quiet"
                  onClick={checkLanguages}
                >
                  Can it work offline?
                </button>
              </div>

              {languageAnswers ? (
                <div className="transcript" style={{ marginTop: 8 }}>
                  {languageAnswers.map((answer) => (
                    <p className="said" key={answer.lang}>
                      <span className="said-when">{answer.lang}</span>
                      <span className="said-what">
                        {answer.onDevice === "available"
                          ? "Already here. It works with no internet."
                          : answer.onDevice === "downloadable"
                            ? "Not here yet, but it can be fetched."
                            : answer.onDevice === "unavailable"
                              ? "Chrome has nothing for this one."
                              : "This Chrome is too old to be asked."}
                      </span>
                      {answer.onDevice === "downloadable" ? (
                        <button
                          type="button"
                          className="button button-quiet"
                          onClick={() => fetchPack(answer.lang)}
                        >
                          {installing === answer.lang ? "Fetching" : "Fetch it"}
                        </button>
                      ) : null}
                    </p>
                  ))}
                </div>
              ) : null}

              {browserEars.error ? (
                <p className="problem">{browserEars.error}</p>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      {/* --- 3 and 4. Loading and the controls -------------------------- */}

      <section className="panel">
        <h2>Listening</h2>

        {!usingBrowser ? (
          <div className="meter" aria-hidden="true">
            <div className="meter-track">
              <div
                className="meter-fill"
                style={{ width: `${microphone.level * 100}%` }}
              />
            </div>
          </div>
        ) : null}

        <p className="status">
          {usingBrowser
            ? !browserEars.exists
              ? "This browser cannot do it. Open the page in Chrome."
              : browserEars.listening
                ? "Listening. Chrome sends a line whenever a phrase finishes."
                : "Not listening"
            : transcriber.status === "loading"
            ? transcriber.progress
              ? `Getting ready. ${transcriber.progress.percent}% of ${transcriber.progress.totalMegabytes} MB. It is not listening yet.`
              : "Getting ready. It is not listening yet."
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

        {!usingBrowser && transcriber.status === "loading" ? (
          <div className="meter" aria-hidden="true">
            <div className="meter-track">
              <div
                className="meter-fill"
                style={{
                  width: `${transcriber.progress ? transcriber.progress.percent : 2}%`,
                }}
              />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className={listening ? "button button-stop" : "button"}
          onClick={listening ? stopEverything : startEverything}
          disabled={usingBrowser && !browserEars.exists}
        >
          {!listening
            ? "Start listening"
            : !usingBrowser && transcriber.status === "loading"
              ? "Stop, it is still getting ready"
              : "Stop"}
        </button>

        {!usingBrowser && transcriber.status === "loading" ? (
          <p className="panel-foot">
            The first time a model is used it downloads in full. Leave this on
            wifi and let it finish. It is kept afterwards, so this happens
            once.
          </p>
        ) : null}

        {!usingBrowser && microphone.error ? (
          <p className="problem">{microphone.error}</p>
        ) : null}

        {!usingBrowser &&
        microphone.rate &&
        microphone.rate !== microphone.wantedRate ? (
          <p className="problem">
            This device gave {microphone.rate} samples a second instead of{" "}
            {microphone.wantedRate}. The words below will be wrong. Tell
            whoever is building this.
          </p>
        ) : null}
      </section>

      {/* --- 4b. What the church screen would be showing ----------------- */}

      <section className="panel">
        <h2>On the screen now</h2>
        <p className="screen-now">
          {screenNow.book
            ? `${screenNow.book} ${screenNow.chapter}:${screenNow.verse}`
            : "Nothing yet"}
        </p>
        <p className="panel-intro">
          {versionName(screenNow.version)}. This is what the church would see.
          It moves when it hears a reference, "the next verse", or a version
          like "NLT".
        </p>
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
                  {line.screen ? (
                    <span className="said-ms">Screen: {line.screen}</span>
                  ) : null}
                </p>
              ))
          )}
        </div>

        <button type="button" className="button" onClick={sendIt}>
          Send the log
        </button>

        <div className="button-row" style={{ marginTop: 8 }}>
          <button type="button" className="button button-quiet" onClick={saveFile}>
            Save it as a file
          </button>
          <button
            type="button"
            className="button button-quiet"
            onClick={copyEverything}
          >
            {copied ? "Copied" : "Copy it all"}
          </button>
        </div>

        <button type="button" className="button button-quiet" onClick={startAgain}>
          Clear and start again
        </button>

        <p className="panel-foot">
          The file holds every line, the model that produced it, how long each
          took, and everything run together at the end. Send that file and
          nothing has to be read off a screenshot. Listening with:{" "}
          {modelName(modelId)}.
        </p>
      </section>
    </main>
  );
}
