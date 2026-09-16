# NOW

**The running order. One thing at a time, finished before the next starts.**

`CURRENT.md` is the full state. This file is only what is next, in order.

The order is not the order the work was first imagined in. **The accuracy
question moved to the front, because it is the only one that can kill the
project.** There is no point designing a beautiful screen for something
that cannot hear "Ephesians".

---

## 1. Hear a real service. Everything else waits.

**Done and waiting on Anthony.** The listening test is built and live at
https://shomea.pages.dev. Nothing else in this list can be sized properly
until it has met a real preacher.

What he does:

1. At home, on wifi, open the site, go to the listening test, pick
   **Moonshine Base** and tap Start listening. Let it download and prove it
   works. Doing this in a church car park on mobile data is how a test gets
   abandoned.
2. At the service, tap Start listening and leave the phone alone.
3. Afterwards, tap **Save the log as a file** and send the file.

**The number that comes out of it:** of the verse references actually
spoken, how many came back right enough to find. Write it into
`RESEARCH.md` section 8.

If Moonshine cannot cope, try Whisper Base on the same recording. That
comparison is the whole point of having five models on one screen.

---

## 2. Make the words findable

Only worth doing once step 1 has produced real transcripts, because it has
to be tuned against what the model actually produced and not against clean
text.

- Match the 66 book names by sound, not spelling, so "a fee shins" reaches
  "Ephesians". `RESEARCH.md` section 1, option A.
- Measure again. The jump between the two numbers decides whether a
  Whisper cascade is needed at all.

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
