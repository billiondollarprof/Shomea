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

// MEASURED ON ANTHONY'S PHONE, 2026-10-29, AND THE ANSWER IS MOONSHINE.
//
//   Moonshine Base       1532ms to 2156ms per piece, and it heard
//                        "Hebrews chapter one, verse two" exactly right
//   Nigerian Whisper     46899ms per piece, and it heard "Diters sharp."
//
// 47 seconds for 5 seconds of speech is not a tuning problem, it is a
// disqualification. A verse has to be on the screen in about two seconds.
// Even the graphics chip, worth perhaps 8 times, would leave it at 6
// seconds, and it was producing nonsense anyway.
//
// Nigerian Whisper is gone from this list and gone from storage. Anthony:
// "if we are retiring the Nigerian whisper, so we'll remove it so that
// space is not occupied." The Bible text needs that room. The measurement
// is kept in RESEARCH.md, which is where evidence belongs.
//
// TWO. Anthony asked for the list to be cut and it keeps getting shorter,
// which is the right direction: this chooser exists only so he can compare,
// and the finished app picks for itself.
//
// What went and why:
//   Moonshine Tiny   Base is better and the saving was 32 MB
//   Whisper Small    the Nigerian one is the same size and trained for here
//   Whisper Tiny     a fallback for a problem that never happened
//
// This chooser is temporary anyway. The finished app picks for itself.
// NOW.md step 2.

export const MODELS = [
  {
    id: "onnx-community/moonshine-base-ONNX",
    name: "Moonshine Base",
    note: "About 2 seconds. The one that works.",
    roughSize: "about 60 MB",
  },
  {
    id: "Xenova/whisper-base.en",
    name: "Whisper Base",
    note: "The neutral comparison. Not trained on any accent.",
    roughSize: "about 50 MB",
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
