# Shomea

**The preacher speaks. The verse appears on the screen.**

Shomea listens to a sermon through a microphone, hears the Bible reference
when it is spoken, and puts that verse on the screen in large, high
contrast text that reads from the back of the room.

It works with no internet.

---

## What it does, in order

1. A lapel microphone is plugged into the device.
2. The app listens the whole time the service is running.
3. The preacher says "turn to Ephesians chapter 2 verse 8".
4. That verse appears on the screen, in the church's chosen version.
5. Later he says "give me another version", without naming the verse again.
   Shomea already knows which verse he means, and switches it.

The device that listens is the device that displays. A laptop at the back
plugged into a projector, or a phone. One device, one app, nothing to pair.

---

## The four things that never change

- **It works offline.** After the first install, no network is needed to
  run a service. Not for the listening, not for the verse, not for the
  switching.
- **It never shows the wrong verse.** A wrong verse on a screen in front of
  a whole church is the worst thing this app can do. Every part of the
  design answers to that.
- **It works for any preacher.** No voice training, no enrolment, no
  set-up tied to one person.
- **Nothing to operate.** Nobody sits at the machine during the service.

---

## Where the words come from

Eleven Bible versions are built into the app. All of them are public
domain, so they can be bundled freely and read offline for ever:

King James, King James 1611, American Standard, World English Bible,
Berean Standard, Darby, Webster, English Revised, Douay-Rheims, Young's
Literal, American King James.

Versions that are under copyright live in a **separate layer that can be
swapped out**, never bundled into the app itself. See `DIRECTION.md` for
why that boundary exists and why it must not be crossed.

---

## The documents in this repository

Read them in this order.

| File | What it holds |
|---|---|
| `DIRECTION.md` | What this is being built toward, and the rules that do not bend |
| `RESEARCH.md` | Everything known about the speech models, the Bible data, the licensing and the hosting |
| `CURRENT.md` | What is actually built right now. Blunt about what is not |
| `NOW.md` | The running order. One thing at a time |
| `SESSIONS.md` | The log of past work sessions |
| `CLAUDE.md` | How to work on this project |

---

## The name

*Shome'a* (שומע) is Hebrew for "hearing", or "one who hears".
