// src/listening/transcriber.worker.js
//
// THE LISTENING MODEL, kept off the main thread.
//
// Why a worker
// ------------
// Running a speech model takes hundreds of milliseconds of solid work. On
// the main thread that freezes the screen, and the screen is the product.
// So the model lives here and talks to the page by message.
//
// Where the model comes from
// --------------------------
// It is fetched from the Hugging Face CDN the first time and then kept in
// the browser's own cache. Nothing is stored in this repository and nothing
// is uploaded to Cloudflare, which is why no R2 bucket is needed and why
// there is nothing for anybody to download by hand.
//
// That means the FIRST run needs internet. Every run after it does not.
// That was always the design. See DIRECTION.md, "It works offline".
//
// What it must never do
// ---------------------
// It must never send audio anywhere. Everything here runs in the browser.
// The only network traffic is fetching the model files once.
//
// Sections
// --------
//   1. Settings that come from the page
//   2. Loading a model
//   3. Transcribing one piece of audio
//   4. The message door

import { pipeline, env } from "@huggingface/transformers";
import { isLocal } from "./models.js";

// WHERE A MODEL IS LOOKED FOR, and it is one of two places.
//
// Most models come from the Hugging Face CDN. One does not: the model
// trained on Nigerian speech is converted in a workflow and kept in our own
// R2 storage, served back through functions/models/[[path]].js at /models/.
//
// These two settings are flipped per model in load() below rather than set
// once here, because looking in the wrong place produces a 404 and then a
// confusing fallback rather than an honest error.
env.localModelPath = "/models/";
env.allowLocalModels = false;

// Keep model files in the browser cache, so the second run is instant and
// the app works with no network.
env.useBrowserCache = true;

// The engine underneath the model is left where the library puts it.
//
// This was very nearly done by hand and it would have been a mistake. The
// library already chooses between four different builds of that engine
// depending on the browser, and it pins the version to the one it was
// tested against. Overriding that means picking the wrong build on some
// device nobody tested on, and finding out during a service.
//
// It is fetched from a CDN the first time, like the model itself, and the
// browser keeps it afterwards.
//
// KNOWN GAP: keeping it for certain across a week is the service worker's
// job, and the service worker is not written yet. Until it is, "offline"
// means offline after a recent visit, not offline for ever. NOW.md step 7.

// Threads need the page to be cross-origin isolated, and the headers that
// do that would block fetching the model. So it runs on one thread. Slower,
// and it works everywhere, which today is worth more.
env.backends.onnx.wasm.numThreads = 1;

// ---------------------------------------------------------------------------
// 1. Settings that come from the page
// ---------------------------------------------------------------------------

let transcriber = null;
let loadedKey = null;

// HOW FAR ALONG THE DOWNLOAD IS, as one number.
//
// The library reports progress per file, so the page used to show 34%, then
// 81%, then 70%, jumping about as each file reported separately. Anthony
// watched that and reasonably concluded it was never finishing.
//
// So every file's progress is remembered and the total is worked out across
// all of them. One number, and it only goes up.
let progressByFile = {};

function say(message) {
  self.postMessage(message);
}

// ---------------------------------------------------------------------------
// 2. Loading a model
// ---------------------------------------------------------------------------
//
// device is "webgpu" (uses the graphics chip, faster) or "wasm" (works
// everywhere, slower). dtype is how much the model is shrunk.
//
// The pair is remembered, so switching model and switching back does not
// download anything twice.

async function load({ modelId, device, dtype }) {
  const key = `${modelId}|${device}|${dtype}`;
  if (transcriber && loadedKey === key) {
    say({ type: "ready", modelId, device, dtype, alreadyLoaded: true });
    return;
  }

  transcriber = null;
  loadedKey = null;
  progressByFile = {};

  say({ type: "loading", modelId, device, dtype });

  // One place or the other, never both. See the note at the top.
  const here = isLocal(modelId);
  env.allowLocalModels = here;
  env.allowRemoteModels = !here;

  try {
    transcriber = await pipeline("automatic-speech-recognition", modelId, {
      device,
      dtype,
      progress_callback: (progress) => {
        if (!progress || !progress.file) return;

        if (progress.status === "progress" && progress.total) {
          progressByFile[progress.file] = {
            loaded: progress.loaded,
            total: progress.total,
          };
        } else if (progress.status === "done") {
          const known = progressByFile[progress.file];
          if (known) known.loaded = known.total;
        }

        let loaded = 0;
        let total = 0;
        Object.values(progressByFile).forEach((one) => {
          loaded += one.loaded;
          total += one.total;
        });

        if (total > 0) {
          say({
            type: "progress",
            percent: Math.min(99, Math.round((loaded / total) * 100)),
            loadedMegabytes: Math.round(loaded / 1024 / 1024),
            totalMegabytes: Math.round(total / 1024 / 1024),
          });
        }
      },
    });
    loadedKey = key;
    say({ type: "ready", modelId, device, dtype, alreadyLoaded: false });
  } catch (problem) {
    say({
      type: "failed",
      stage: "load",
      modelId,
      device,
      dtype,
      message: String((problem && problem.message) || problem),
    });
  }
}

// ---------------------------------------------------------------------------
// 3. Transcribing one piece of audio
// ---------------------------------------------------------------------------

async function transcribe({ id, audio, modelId }) {
  if (!transcriber) {
    say({ type: "failed", stage: "transcribe", id, message: "No model loaded." });
    return;
  }

  const startedAt = performance.now();
  try {
    // NOTHING IS PASSED HERE, AND THAT IS THE FIX.
    //
    // This used to send { language: "english", task: "transcribe" } to any
    // model with "whisper" in its name. Every single Whisper model then
    // failed, on a real phone, with:
    //
    //   Cannot specify `task` or `language` for an English-only model.
    //
    // The models on the list are the ".en" ones. They only speak English,
    // so telling them which language to use is not helpful, it is an error.
    // Those two options belong to the multilingual builds only.
    //
    // Moonshine is English only too and never took them.
    //
    // So neither family wants them, and the safe thing is to send nothing.
    // If a multilingual Whisper is ever added to models.js, this is the line
    // that has to learn the difference. Until then, do not add it back.
    const output = await transcriber(audio);
    const text = (output && output.text ? output.text : "").trim();

    say({
      type: "result",
      id,
      text,
      milliseconds: Math.round(performance.now() - startedAt),
    });
  } catch (problem) {
    say({
      type: "failed",
      stage: "transcribe",
      id,
      milliseconds: Math.round(performance.now() - startedAt),
      message: String((problem && problem.message) || problem),
    });
  }
}

// ---------------------------------------------------------------------------
// 4. The message door
// ---------------------------------------------------------------------------

self.addEventListener("message", (event) => {
  const message = event.data;
  if (!message || !message.type) return;
  if (message.type === "load") load(message);
  else if (message.type === "transcribe") transcribe(message);
});
