// src/listening/models.js
//
// THE LIST OF LISTENING MODELS, and nothing else.
//
// It is its own file because it is the thing most likely to change, and
// changing it must never mean opening the pipeline.
//
// Every one of these is fetched from the Hugging Face CDN on first use and
// then kept in the browser's cache. None of them live in this repository,
// so adding one here costs nothing at build time.
//
// The sizes are what the browser actually downloads at dtype q8. They were
// taken from search results and NOT from a download, because the session
// that wrote this file could not reach huggingface.co. Correct them the
// first time a real device reports something different.
//
// RESEARCH.md section 1 explains why Moonshine is first.

export const MODELS = [
  {
    id: "onnx-community/moonshine-base-ONNX",
    name: "Moonshine Base",
    note: "Built for live listening. First choice.",
    roughSize: "about 60 MB",
  },
  {
    id: "onnx-community/moonshine-tiny-ONNX",
    name: "Moonshine Tiny",
    note: "Smallest and fastest. Try if Base is slow.",
    roughSize: "about 28 MB",
  },
  {
    id: "Xenova/whisper-base.en",
    name: "Whisper Base",
    note: "Slower, but usually better on a strong accent.",
    roughSize: "about 50 MB",
  },
  {
    id: "Xenova/whisper-small.en",
    name: "Whisper Small",
    note: "Best accuracy here, and the heaviest. Needs patience.",
    roughSize: "about 250 MB",
  },
  {
    id: "Xenova/whisper-tiny.en",
    name: "Whisper Tiny",
    note: "The fallback if nothing else will load.",
    roughSize: "about 20 MB",
  },
];

export const DEFAULT_MODEL = MODELS[0].id;

export function modelName(id) {
  const found = MODELS.find((model) => model.id === id);
  return found ? found.name : id;
}
