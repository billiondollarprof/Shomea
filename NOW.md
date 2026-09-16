# NOW

**The running order. One thing at a time, finished before the next starts.**

`CURRENT.md` is the full state. This file is only what is next, in order.

The order is not the order the work was first imagined in. **The accuracy
question moved to the front, because it is the only one that can kill the
project.** There is no point designing a beautiful screen for something
that cannot hear "Ephesians".

---

## 1. Match the book names by sound. This is the whole thing.

**Anthony's first real test proved where the win is.** Moonshine heard
"Exodus chapter 6 verse 1" perfectly. It heard a bare "verse number one" as
"Best number line". The difference is the book name: with it, everything
after lands; without it, there is nothing to hold onto.

And every failure it did make is recoverable by sound:

    "Like toast one one"          ->  Titus 1:1
    "Provide chapter 2 verse 1"   ->  Proverbs 2:1

So:

- A table of the 66 books, their short forms and how people actually say
  them.
- Match by sound, not spelling, so "like toast" reaches Titus.
- **A number is only believed when a confident book match came just before
  it.** A bare number is noise and must be thrown away. `DIRECTION.md`:
  never show the wrong verse.
- Score every candidate, and keep the screen blank below the bar.

Measure against the transcripts already in `RESEARCH.md` section 8, then
against a real service.

---

## 2. Switch between the models by itself

Anthony's brief: nobody should be choosing a model. It should choose.

The shape, and it only works once step 1 exists, because step 1 is what
produces the confidence score:

1. Moonshine listens to everything. It is fast and it is the better
   listener in a room.
2. When a piece of audio looks like it holds a reference but the book match
   is weak, that same two to four seconds goes to Whisper.
3. Whisper's answer wins when it is more confident.

**Whisper has to be proved working first.** It failed every time in the
first test because of a bug in our own code, now fixed, so nobody yet knows
whether it is any good on this accent. Retry it before building the switch
on top of it.

Until then the model chooser stays on `/dev`, where only Anthony sees it.

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
