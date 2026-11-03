// src/listening/segmenter.js
//
// CUTS THE MICROPHONE'S SOUND AT THE PAUSES, NOT ON A CLOCK.
//
// Why this file exists
// --------------------
// The first version cut the sound into fixed 5 second pieces on a timer,
// whether or not anybody was in the middle of a word. Anthony's logs showed
// what that does:
//
//   - A phrase that started "First John..." could lose its first word at a
//     cut, and "John three verse one" opened the Gospel of John, when it was
//     1 John 3:1. That is a wrong verse on the screen.
//   - Moonshine returned nothing for many pieces that held half a phrase.
//
// So this waits for a person to START speaking, keeps a little sound from
// BEFORE that (so the first word is never clipped), follows the speech, and
// cuts only after a real pause. One segment is one phrase.
//
// How it decides "speaking"
// -------------------------
// It compares the loudness of each 30 millisecond slice against the room. The
// room's loudness is measured all the time while nobody is speaking, so a fan
// or a hum raises the bar by itself. Speech is anything clearly above that.
//
// It is plain loudness, not a trained model. That is a deliberate first step:
// a trained voice detector (Silero) is the better tool, and it is a heavy file
// that Cloudflare's 25 MiB limit makes awkward. Loudness comes first. If a
// real service shows it cutting in the wrong places, the detector is the next
// step and this file is the one thing that changes.
//
// THE NUMBERS ARE A FIRST GUESS FROM TWO LOGS, NOT A MEASUREMENT.
// Anthony's phone gave pieces with 0.014 to 0.042 average loudness, so the
// speech is quiet and the lowest allowed bar is small. Tune them from real
// services, one at a time, and write the reason next to the change.
//
// What it must never do
// ---------------------
// It must never keep audio after it has handed it on, and never touch the
// network or the screen. It takes numbers in and gives phrases back.
//
// Sections
// --------
//   1. The settings
//   2. Making one
//   3. Following the sound, one slice at a time
//   4. Handing a phrase on

// ---------------------------------------------------------------------------
// 1. The settings
// ---------------------------------------------------------------------------

export const SETTINGS = {
  // How long each slice is judged over.
  sliceSeconds: 0.03,

  // Sound kept from BEFORE speech was noticed, so the first word survives.
  beforeSeconds: 0.3,

  // How many loud slices in a row count as speech starting. Two is 60
  // milliseconds, which is longer than a click and shorter than any word.
  loudSlicesToStart: 2,

  // How long it must be quiet before the phrase is over. Too short and a
  // phrase is split at a breath, "Malachi chapter three ... verse five", and
  // the second half has no book. Too long and every verse arrives late. The
  // between-the-words gaps in ordinary speech are well under this.
  pauseSeconds: 0.8,

  // Quiet kept on the end of a phrase, so the last word is not clipped.
  afterSeconds: 0.25,

  // Less loud sound than this is a click or a cough, not a word.
  shortestSpeechSeconds: 0.24,

  // No phrase is longer than this. A preacher can go on past it, and a
  // model gets worse and slower on long audio. At the cut, the last second
  // is carried into the next phrase so no word is split.
  longestSeconds: 12,
  carriedSeconds: 1,

  // A steady hum has the same loudness in every slice. Speech goes up and down
  // with every syllable. If a phrase hits the longest length and its slices
  // vary by less than this fraction of their average, it is a hum: the room is
  // taught that loudness and the phrase is thrown away. Without this a fan
  // that is already running when listening starts is sent to the model every
  // twelve seconds for ever.
  steadyIfVariesLessThan: 0.2,

  // "Clearly above the room" is this many times the room's loudness, and
  // never less than the floor below, so a very quiet room does not make a
  // breath sound like speech.
  timesTheRoom: 3,
  quietestBar: 0.008,
  startingRoom: 0.004,

  // How fast the idea of "the room" follows changes. Higher follows faster.
  roomFollowsAt: 0.03,
};

// ---------------------------------------------------------------------------
// 2. Making one
// ---------------------------------------------------------------------------
//
// push() takes sound as it arrives, in any size, and returns the phrases that
// finished. flush() returns the phrase still in progress, for when listening
// stops.

export function makeSegmenter({ rate = 16000, settings = SETTINGS } = {}) {
  const slice = Math.round(rate * settings.sliceSeconds);
  const slices = (seconds) => Math.max(1, Math.round(seconds / settings.sliceSeconds));

  const beforeSlices = slices(settings.beforeSeconds);
  const pauseSlices = slices(settings.pauseSeconds);
  const afterSlices = slices(settings.afterSeconds);
  const shortestSlices = slices(settings.shortestSpeechSeconds);
  const longestSlices = slices(settings.longestSeconds);
  const carriedSlices = slices(settings.carriedSeconds);

  let held = new Float32Array(0); // sound not yet a whole slice
  let consumed = 0; // slices judged so far, which is also the clock

  let room = settings.startingRoom;
  let speaking = false;
  let loudRun = 0;
  let quietRun = 0;
  let loudCount = 0;

  // Recent slices while nobody is speaking: the sound kept from before.
  let recent = [];
  // The phrase being followed. Each entry is { audio, at }.
  let phrase = [];

  const bar = () => Math.max(settings.quietestBar, room * settings.timesTheRoom);

  // -------------------------------------------------------------------------
  // 3. Following the sound, one slice at a time
  // -------------------------------------------------------------------------

  function loudness(audio) {
    let sum = 0;
    for (let i = 0; i < audio.length; i += 1) sum += audio[i] * audio[i];
    return Math.sqrt(sum / audio.length);
  }

  function step(audio, out) {
    const level = loudness(audio);
    const at = consumed;
    consumed += 1;
    const loud = level > bar();

    if (!speaking) {
      recent.push({ audio, at });
      if (recent.length > beforeSlices + settings.loudSlicesToStart) recent.shift();

      if (loud) {
        loudRun += 1;
      } else {
        loudRun = 0;
        // Only learn the room from slices with nobody speaking in them.
        room += (level - room) * settings.roomFollowsAt;
      }

      if (loudRun >= settings.loudSlicesToStart) {
        speaking = true;
        phrase = recent;
        recent = [];
        loudCount = loudRun;
        quietRun = 0;
        loudRun = 0;
      }
      return;
    }

    phrase.push({ audio, at });
    if (loud) {
      loudCount += 1;
      quietRun = 0;
    } else {
      quietRun += 1;
    }

    if (quietRun >= pauseSlices) {
      finish(out, false);
    } else if (phrase.length >= longestSlices) {
      finish(out, true);
    }
  }

  // -------------------------------------------------------------------------
  // 4. Handing a phrase on
  // -------------------------------------------------------------------------

  // How much the slices of a phrase vary in loudness, as a fraction of their
  // average. Speech is high. A hum is close to nothing.
  function variation(slicesOfPhrase) {
    const levels = slicesOfPhrase.map((one) => loudness(one.audio));
    const mean = levels.reduce((a, b) => a + b, 0) / levels.length;
    const spread = Math.sqrt(
      levels.reduce((a, b) => a + (b - mean) * (b - mean), 0) / levels.length,
    );
    return { mean, fraction: mean > 0 ? spread / mean : 0 };
  }

  function finish(out, forced) {
    let kept = phrase;

    if (forced) {
      const { mean, fraction } = variation(phrase);
      if (fraction < settings.steadyIfVariesLessThan) {
        room = mean;
        speaking = false;
        phrase = [];
        recent = [];
        loudCount = 0;
        quietRun = 0;
        loudRun = 0;
        return;
      }
    }

    if (!forced) {
      // Drop the pause, but keep a little of it so the last word is whole.
      const extraQuiet = quietRun - afterSlices;
      if (extraQuiet > 0) kept = phrase.slice(0, phrase.length - extraQuiet);
    }

    if (loudCount >= shortestSlices) {
      const total = kept.reduce((sum, one) => sum + one.audio.length, 0);
      const audio = new Float32Array(total);
      let place = 0;
      kept.forEach((one) => {
        audio.set(one.audio, place);
        place += one.audio.length;
      });
      out.push({
        audio,
        rms: loudness(audio),
        silent: false,
        seconds: audio.length / rate,
        startedAt: (kept[0].at * slice) / rate,
        // How loud the room was and how high the bar was, so a log can show
        // why something was or was not heard.
        room,
        bar: bar(),
        forced,
      });
    }

    if (forced) {
      // Still speaking. Carry the last second into the next phrase.
      phrase = phrase.slice(Math.max(0, phrase.length - carriedSlices));
      loudCount = 0;
      quietRun = 0;
    } else {
      speaking = false;
      phrase = [];
      recent = [];
      loudCount = 0;
      quietRun = 0;
      loudRun = 0;
    }
  }

  function push(samples) {
    const out = [];
    let all = samples;
    if (held.length) {
      all = new Float32Array(held.length + samples.length);
      all.set(held, 0);
      all.set(samples, held.length);
    }
    let place = 0;
    while (place + slice <= all.length) {
      step(all.subarray(place, place + slice), out);
      place += slice;
    }
    held = all.slice(place);
    return out;
  }

  function flush() {
    const out = [];
    if (speaking) finish(out, false);
    held = new Float32Array(0);
    return out;
  }

  return { push, flush };
}
