// src/listening/useBrowserEars.js
//
// THE BROWSER'S OWN EARS. No model to download, no storage, no worker.
//
// Why this file exists
// --------------------
// Anthony, 2026-10-30, after noticing that dictating to Claude on his phone
// stopped producing gibberish a few months ago:
//
//   "what is Anthropic using? Is it free? And what is ChatGPT also using?
//   ...Even Google, Gemini, they are all doing well with Nigerian accent."
//
// The answer nobody publishes is that all of them send the audio to a big
// model on a server. Those are not free, not offline, and not available to
// us as a library.
//
// **But Chrome has Google's own speech engine built in, and it is free.**
// No key, no account, no download managed by us. It is the same family of
// engine that handles his accent well in other apps.
//
// Two ways it can run, and we ask for the better one
// --------------------------------------------------
//   processLocally = true    Chrome 139 and later. The recognition happens
//                            ON THE DEVICE, from a language pack Chrome
//                            downloads once. **Offline, and free.**
//   processLocally = false   Audio goes to Google's servers. Better still,
//                            but needs the network.
//
// If the on-device pack can be installed, this is better than anything we
// have built: no 279 MB of our own, no R2, no conversion pipeline, and an
// engine tuned by people with far more Nigerian speech than we will ever
// have.
//
// What it cannot do
// ------------------
// - **Chrome only.** Not Safari, so not an iPhone. The church runs a
//   laptop into a projector, so that is survivable, but it is a real limit.
// - **No version pinning.** Google changes the engine when it likes, and
//   accuracy can move without us touching anything.
// - **No word hints.** We cannot tell it to expect "Ephesians".
//
// Sections
// --------
//   1. Is it there at all
//   2. Getting the on-device pack
//   3. Listening

import { useCallback, useEffect, useRef, useState } from "react";

// en-NG is Nigerian English and it is a real language tag. If Chrome has a
// pack for it, that is a better fit than anything else on this list. en-GB
// is the fallback because Nigerian English follows British spelling and
// vocabulary far more closely than American.
export const LANGUAGES = ["en-NG", "en-GB", "en-US"];

function theClass() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

// ---------------------------------------------------------------------------
// 1. Is it there at all
// ---------------------------------------------------------------------------

export function browserEarsExist() {
  return Boolean(theClass());
}

// ---------------------------------------------------------------------------
// 2. Getting the on-device pack
// ---------------------------------------------------------------------------
//
// available() answers "available", "downloadable" or "unavailable" for a
// language. install() fetches the pack. Both are new, so everything here
// is wrapped: an older Chrome simply has neither.

export async function askAboutLanguages() {
  const Recognition = theClass();
  if (!Recognition || typeof Recognition.available !== "function") {
    return LANGUAGES.map((lang) => ({ lang, onDevice: "cannot ask" }));
  }

  const answers = [];
  for (const lang of LANGUAGES) {
    let onDevice = "cannot ask";
    try {
      onDevice = await Recognition.available({
        langs: [lang],
        processLocally: true,
      });
    } catch {
      onDevice = "cannot ask";
    }
    answers.push({ lang, onDevice });
  }
  return answers;
}

export async function installLanguage(lang) {
  const Recognition = theClass();
  if (!Recognition || typeof Recognition.install !== "function") {
    return "this Chrome cannot install one";
  }
  try {
    const done = await Recognition.install({
      langs: [lang],
      processLocally: true,
    });
    return done ? "installed" : "refused";
  } catch (problem) {
    return `failed: ${(problem && problem.message) || problem}`;
  }
}

// ---------------------------------------------------------------------------
// 3. Listening
// ---------------------------------------------------------------------------
//
// Chrome hands back a stream of results, each marked final or not. Only
// the final ones are passed on, because an interim result changes under
// you and a verse that flickers is worse than one that arrives a moment
// later.

export function useBrowserEars({ onHeard, onFailure }) {
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState(LANGUAGES[1]);
  const [onDevice, setOnDevice] = useState(true);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const wantedRef = useRef(false);
  const startedAtRef = useRef(0);
  const onHeardRef = useRef(onHeard);
  const onFailureRef = useRef(onFailure);

  useEffect(() => {
    onHeardRef.current = onHeard;
    onFailureRef.current = onFailure;
  }, [onHeard, onFailure]);

  const stop = useCallback(() => {
    wantedRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Stopping something already stopped is not a problem.
      }
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Recognition = theClass();
    if (!Recognition) {
      setError("This browser has no speech recognition. Chrome has it.");
      return;
    }

    setError(null);
    wantedRef.current = true;

    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = false;

    // Chrome 139 and later. An older one ignores it and uses the network,
    // which still works, so this is not guarded.
    try {
      recognition.processLocally = onDevice;
    } catch {
      // Older Chrome. Nothing to do.
    }

    recognition.onstart = () => {
      startedAtRef.current = performance.now();
      setListening(true);
    };

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result.isFinal) continue;
        const text = result[0].transcript.trim();
        if (!text) continue;

        const took = Math.round(performance.now() - startedAtRef.current);
        startedAtRef.current = performance.now();

        if (onHeardRef.current) {
          onHeardRef.current({
            text,
            milliseconds: took,
            confidence: result[0].confidence,
          });
        }
      }
    };

    recognition.onerror = (event) => {
      const what = event.error;
      // "no-speech" happens constantly during a sermon's quiet moments and
      // is not a fault. Anything else is worth recording.
      if (what === "no-speech" || what === "aborted") return;
      if (onFailureRef.current) {
        onFailureRef.current({
          message:
            what === "not-allowed"
              ? "Permission was refused. Allow the microphone and try again."
              : what === "network"
                ? "It needs the network for this mode, and could not reach it."
                : `Chrome said: ${what}`,
        });
      }
    };

    // Chrome stops on its own after a pause. For a forty minute sermon it
    // has to be restarted, quietly, every time.
    recognition.onend = () => {
      if (!wantedRef.current) {
        setListening(false);
        return;
      }
      try {
        recognition.start();
      } catch {
        setListening(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (problem) {
      setError(`It would not start. ${(problem && problem.message) || problem}`);
      setListening(false);
    }
  }, [lang, onDevice]);

  useEffect(() => stop, [stop]);

  return {
    listening,
    lang,
    setLang,
    onDevice,
    setOnDevice,
    error,
    start,
    stop,
    exists: browserEarsExist(),
  };
}
