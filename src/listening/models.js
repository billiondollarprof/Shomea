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
// The sizes are what the browser actually downloads at dtype q8.
//
// Nigerian Whisper's 274 MB is MEASURED, from the conversion that produced
// it on 2026-10-29. The others are still from search results rather than a
// download, because this session cannot reach huggingface.co. Correct them
// the first time a real device reports something different.
//
// WHERE A MODEL COMES FROM
// ------------------------
// Most of these are fetched from the Hugging Face CDN the first time and
// then kept by the browser.
//
// One is not. A model trained on Nigerian speech has to be exported and
// shrunk before a browser can run it, which happens in a GitHub Actions
// workflow, and the result lives in our own R2 storage. Those are marked
// local, and the worker then looks for them at /models/ on our own address
// rather than at Hugging Face.
//
// RESEARCH.md section 1 explains why Moonshine is first. Section 8 explains
// why a Nigerian-accent model is on the list at all.

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
    id: "nigerian-whisper-small",
    name: "Nigerian Whisper",
    note: "Trained on Nigerian voices. The one to beat.",
    roughSize: "274 MB",
    local: true,
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

// True when the model is served from our own deployment rather than from
// Hugging Face. The worker needs to know, because the two are looked for in
// completely different places.
export function isLocal(id) {
  const found = MODELS.find((model) => model.id === id);
  return Boolean(found && found.local);
}
