# NOW

**The running order. One thing at a time, finished before the next starts.**

`CURRENT.md` is the full state. This file is only what is next, in order.

The order is not the order the work was first imagined in. **The accuracy
question moved to the front, because it is the only one that can kill the
project.** There is no point designing a beautiful screen for something
that cannot hear "Ephesians".

---

## 1. A preview URL. Nothing else can be seen until this exists.

Anthony has a phone and an iPad, no laptop. **He cannot open localhost.**
So until this repository builds to a URL, he cannot look at anything that
gets made, and every piece of work after this one is invisible to him.

- Connect this repository to Cloudflare Pages.
- Confirm a branch push produces a preview URL.
- Send him the URL and have him open it on his phone.

Free tier: 500 builds a month, unlimited static bandwidth. Plenty.

---

## 2. The accuracy spike. Before any design work.

The one number that decides the project.

- Start from `huggingface/transformers.js-examples/moonshine-web`. Do not
  build the audio pipeline from scratch.
- A rough page: it listens, it prints what it heard. Nothing else.
- Deploy it to the preview URL.
- Anthony plays real sermon recordings at it, on his phone.

**Measure this: out of 50 spoken verse references, how many come back
right?**

- Compare Moonshine tiny, Moonshine base and Whisper base.
- Then add the fuzzy and phonetic book-name matching from `RESEARCH.md`
  section 1, option A, and measure again.

**That second number decides whether a cascade is needed.** Write both
numbers into `RESEARCH.md`.

Blocked on Anthony supplying a recording. Everything else in this step can
be built while waiting.

---

## 3. The reference parser and its gates

`openbibleinfo/Bible-Passage-Reference-Parser`, gated so it stays quiet
when unsure.

**Tuned against the messy transcripts from step 2. Never against clean
text.** A parser that is perfect on typed input and eager on speech is
worse than useless here.

---

## 4. The Bible text

- Pull the eleven public domain versions. `RESEARCH.md` section 4.
- Normalise them into one shape.
- Build the verse lookup.
- **Build the swappable licensed layer now, while it is empty**, so nothing
  copyrighted ever ends up bundled by accident.

---

## 5. The screen

Dark, high contrast, readable from the back row. **Design work happens
here, not before.**

Screenshot at phone width and desktop width, both themes. Send Anthony the
preview URL.

---

## 6. The verse log and the version switch

Including the learned version order. No model call, so it is instant.
`RESEARCH.md` section 5.

---

## 7. Offline

Service worker, Cache API, IndexedDB, wake lock. Then a genuine aeroplane
mode test on a real device, in a real room.

**This is where `RESEARCH.md` section 7 item 2 gets answered**, about
iPhone storage being cleared between Sundays. Find out early if it is a
problem, not on the day.

---

## 8. Good News Bible

API.Bible free tier, fetched at build time so the key never reaches a
browser, refreshed monthly to satisfy their 30 day rule.

---

## 9. A real service

Back of the room, real microphone, real preacher, projector, aeroplane
mode, and nobody touching the machine.

**This is the measure of done.** `DIRECTION.md` section 6.

---

## 10. Gated and optional

Matching a quoted line with no reference. Built, shipped switched off,
turned on only once a real service has proved it. Dropped without regret if
it does not earn its place.
